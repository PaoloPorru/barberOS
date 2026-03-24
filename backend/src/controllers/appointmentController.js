const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { Appointment, Service, Barber, User } = require('../models');
const { invalidateCache } = require('../services/slotService');
const { sendEmail } = require('../config/email');
const logger = require('../config/logger');

const APPOINTMENT_INCLUDE = [
  { model: User,    as: 'client',  attributes: ['id','first_name','last_name','email','phone'] },
  { model: Service, as: 'service', attributes: ['id','name','price','duration_minutes'] },
  {
    model: Barber, as: 'barber', attributes: ['id','color_hex'],
    include: [{ model: User, as: 'user', attributes: ['id','first_name','last_name'] }],
  },
];

// GET /api/appointments
async function getAll(req, res, next) {
  try {
    const { barber_id, date, status, page = 1, limit = 20 } = req.query;
    const where = {};

    // Role-based filtering
    if (req.user.role === 'CLIENT')        where.client_id = req.user.id;
    else if (req.user.role === 'BARBER') {
      const barber = await Barber.findOne({ where: { user_id: req.user.id } });
      if (!barber) return res.status(404).json({ error: 'Profilo barbiere non trovato' });
      where.barber_id = barber.id;
    }

    if (barber_id && req.user.role === 'ADMIN') where.barber_id = barber_id;
    if (status)  where.status = status;
    if (date) {
      where.start_datetime = {
        [Op.between]: [new Date(date + 'T00:00:00'), new Date(date + 'T23:59:59')],
      };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Appointment.findAndCountAll({
      where,
      include: APPOINTMENT_INCLUDE,
      order: [['start_datetime', 'ASC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) },
    });
  } catch (err) { next(err); }
}

// GET /api/appointments/:id
async function getOne(req, res, next) {
  try {
    const apt = await Appointment.findByPk(req.params.id, { include: APPOINTMENT_INCLUDE });
    if (!apt) return res.status(404).json({ error: 'Appuntamento non trovato' });

    // Accesso: solo il cliente proprietario, il barbiere o l'admin
    if (req.user.role === 'CLIENT' && apt.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Accesso negato' });
    }

    res.json({ data: apt });
  } catch (err) { next(err); }
}

// POST /api/appointments
async function create(req, res, next) {
  try {
    const { barber_id, service_id, start_datetime, notes } = req.body;
    const client_id = req.user.id;

    const service = await Service.findByPk(service_id);
    if (!service || !service.is_active) {
      return res.status(400).json({ error: 'Servizio non disponibile' });
    }

    const barber = await Barber.findByPk(barber_id, {
      include: [{ model: User, as: 'user', attributes: ['first_name','last_name'] }],
    });
    if (!barber || !barber.is_accepting) {
      return res.status(400).json({ error: 'Barbiere non disponibile' });
    }

    const start = new Date(start_datetime);
    const end   = new Date(start.getTime() + service.duration_minutes * 60_000);

    if (start <= new Date()) {
      return res.status(400).json({ error: 'Non puoi prenotare nel passato' });
    }

    // Transazione + lock per prevenire race condition
    const appointment = await sequelize.transaction(async (t) => {
      // Controlla sovrapposizione con lock pessimistico
      const [conflict] = await sequelize.query(
        `SELECT id FROM appointments
         WHERE barber_id = :barberId
           AND status != 'CANCELLED'
           AND start_datetime < :end
           AND end_datetime   > :start
         FOR UPDATE SKIP LOCKED`,
        { replacements: { barberId: barber_id, start, end }, transaction: t, type: 'SELECT' }
      );

      if (conflict.length > 0) {
        const err = new Error('Slot non disponibile: scegli un altro orario');
        err.status = 409;
        throw err;
      }

      return Appointment.create({
        client_id, barber_id, service_id,
        start_datetime: start, end_datetime: end,
        status: 'CONFIRMED',
        price_snapshot: service.price,
        notes,
      }, { transaction: t });
    });

    // Invalida cache
    const dateStr = start.toISOString().split('T')[0];
    await invalidateCache(barber_id, dateStr);

    // Email conferma (asincrona — non blocca la risposta)
    const client = req.user;
    sendEmail(client.email, 'appointmentConfirmed', {
      clientName: `${client.first_name} ${client.last_name}`,
      date:        start.toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long', year:'numeric' }),
      time:        start.toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' }),
      barberName: `${barber.user.first_name} ${barber.user.last_name}`,
      serviceName: service.name,
      price:       service.price.toFixed(2),
    }).catch(err => logger.error('Email error:', err));

    const full = await Appointment.findByPk(appointment.id, { include: APPOINTMENT_INCLUDE });
    res.status(201).json({ data: full });
  } catch (err) { next(err); }
}

// PATCH /api/appointments/:id
async function update(req, res, next) {
  try {
    const apt = await Appointment.findByPk(req.params.id);
    if (!apt) return res.status(404).json({ error: 'Appuntamento non trovato' });
    if (req.user.role === 'CLIENT' && apt.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    if (['CANCELLED','COMPLETED'].includes(apt.status)) {
      return res.status(400).json({ error: 'Impossibile modificare un appuntamento già concluso' });
    }

    const { start_datetime, service_id, barber_id, notes } = req.body;
    const updates = { notes };

    if (start_datetime || service_id || barber_id) {
      const newServiceId = service_id || apt.service_id;
      const service = await Service.findByPk(newServiceId);
      const start   = new Date(start_datetime || apt.start_datetime);
      const end     = new Date(start.getTime() + service.duration_minutes * 60_000);
      updates.start_datetime = start;
      updates.end_datetime   = end;
      updates.price_snapshot = service.price;
      if (service_id) updates.service_id = service_id;
      if (barber_id)  updates.barber_id  = barber_id;
    }

    await apt.update(updates);
    const dateStr = new Date(apt.start_datetime).toISOString().split('T')[0];
    await invalidateCache(apt.barber_id, dateStr);

    const full = await Appointment.findByPk(apt.id, { include: APPOINTMENT_INCLUDE });
    res.json({ data: full });
  } catch (err) { next(err); }
}

// DELETE /api/appointments/:id
async function remove(req, res, next) {
  try {
    const apt = await Appointment.findByPk(req.params.id, { include: APPOINTMENT_INCLUDE });
    if (!apt) return res.status(404).json({ error: 'Appuntamento non trovato' });
    if (req.user.role === 'CLIENT' && apt.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Accesso negato' });
    }

    const dateStr = new Date(apt.start_datetime).toISOString().split('T')[0];
    await apt.update({ status: 'CANCELLED' });
    await invalidateCache(apt.barber_id, dateStr);

    sendEmail(req.user.email, 'appointmentCancelled', {
      clientName: `${req.user.first_name} ${req.user.last_name}`,
      date: new Date(apt.start_datetime).toLocaleDateString('it-IT'),
      time: new Date(apt.start_datetime).toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' }),
    }).catch(() => {});

    res.json({ message: 'Appuntamento cancellato' });
  } catch (err) { next(err); }
}

// PATCH /api/appointments/:id/status  [BARBER, ADMIN]
async function updateStatus(req, res, next) {
  try {
    const apt = await Appointment.findByPk(req.params.id);
    if (!apt) return res.status(404).json({ error: 'Appuntamento non trovato' });

    if (req.user.role === 'BARBER') {
      const barber = await Barber.findOne({ where: { user_id: req.user.id } });
      if (!barber || apt.barber_id !== barber.id) {
        return res.status(403).json({ error: 'Accesso negato' });
      }
    }

    await apt.update({ status: req.body.status });
    res.json({ data: apt });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, remove, updateStatus };
