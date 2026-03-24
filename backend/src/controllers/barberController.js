const { Barber, User, Availability, BlockedSlot } = require('../models');
const { validate, schemas } = require('../middleware/validate');

// GET /api/barbers
async function getAll(req, res, next) {
  try {
    const barbers = await Barber.findAll({
      where: { is_accepting: true },
      include: [{ model: User, as: 'user', attributes: ['id','first_name','last_name','email'] }],
    });
    res.json({ data: barbers });
  } catch (err) { next(err); }
}

// GET /api/barbers/:id
async function getOne(req, res, next) {
  try {
    const barber = await Barber.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id','first_name','last_name','email','phone'] },
        { model: Availability, as: 'availability', where: { is_active: true }, required: false },
      ],
    });
    if (!barber) return res.status(404).json({ error: 'Barbiere non trovato' });
    res.json({ data: barber });
  } catch (err) { next(err); }
}

// GET /api/barbers/:id/availability
async function getAvailability(req, res, next) {
  try {
    const rows = await Availability.findAll({
      where: { barber_id: req.params.id, is_active: true },
      order: [['day_of_week', 'ASC']],
    });
    res.json({ data: rows });
  } catch (err) { next(err); }
}

// PUT /api/barbers/:id/availability  [BARBER, ADMIN]
async function setAvailability(req, res, next) {
  try {
    const { availability } = req.body;
    const barberId = req.params.id;

    // Verifica ownership
    if (req.user.role === 'BARBER') {
      const barber = await Barber.findOne({ where: { user_id: req.user.id } });
      if (!barber || barber.id !== barberId) {
        return res.status(403).json({ error: 'Accesso negato' });
      }
    }

    // Upsert per ogni giorno
    const results = [];
    for (const row of availability) {
      const [record] = await Availability.upsert({
        barber_id:   barberId,
        day_of_week: row.day_of_week,
        start_time:  row.start_time,
        end_time:    row.end_time,
        is_active:   row.is_active ?? true,
      });
      results.push(record);
    }

    res.json({ data: results });
  } catch (err) { next(err); }
}

// POST /api/barbers/:id/blocked-slots  [BARBER, ADMIN]
async function blockSlot(req, res, next) {
  try {
    const { start_datetime, end_datetime, reason } = req.body;

    if (new Date(end_datetime) <= new Date(start_datetime)) {
      return res.status(400).json({ error: 'La data di fine deve essere dopo quella di inizio' });
    }

    const slot = await BlockedSlot.create({
      barber_id:      req.params.id,
      start_datetime, end_datetime, reason,
    });

    res.status(201).json({ data: slot });
  } catch (err) { next(err); }
}

// DELETE /api/barbers/:id/blocked-slots/:slotId  [BARBER, ADMIN]
async function unblockSlot(req, res, next) {
  try {
    const slot = await BlockedSlot.findOne({
      where: { id: req.params.slotId, barber_id: req.params.id },
    });
    if (!slot) return res.status(404).json({ error: 'Slot non trovato' });
    await slot.destroy();
    res.json({ message: 'Slot sbloccato' });
  } catch (err) { next(err); }
}

// GET /api/barbers/:id/blocked-slots  [BARBER, ADMIN]
async function getBlockedSlots(req, res, next) {
  try {
    const { from, to } = req.query;
    const where = { barber_id: req.params.id };
    if (from) where.start_datetime = { $gte: new Date(from) };
    if (to)   where.end_datetime   = { $lte: new Date(to) };

    const slots = await BlockedSlot.findAll({ where, order: [['start_datetime','ASC']] });
    res.json({ data: slots });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, getAvailability, setAvailability, blockSlot, unblockSlot, getBlockedSlots };
