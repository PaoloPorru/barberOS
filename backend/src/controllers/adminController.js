const { Op, fn, col, literal } = require('sequelize');
const bcrypt = require('bcryptjs');
const { User, Barber, Appointment, Service } = require('../models');

// GET /api/admin/stats
async function getStats(req, res, next) {
  try {
    const { period = 'week' } = req.query;
    const now = new Date();
    let fromDate;

    if (period === 'day')   fromDate = new Date(now.setHours(0,0,0,0));
    else if (period === 'week') {
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
    } else if (period === 'month') {
      fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - 1);
    }

    const where = {
      status: { [Op.ne]: 'CANCELLED' },
      start_datetime: { [Op.gte]: fromDate },
    };

    const [totalApts, revenue, byStatus, todayApts] = await Promise.all([
      // Totale appuntamenti nel periodo
      Appointment.count({ where }),

      // Incassi (sum price_snapshot per COMPLETED)
      Appointment.sum('price_snapshot', {
        where: { ...where, status: 'COMPLETED' },
      }),

      // Conta per status
      Appointment.findAll({
        where,
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),

      // Appuntamenti di oggi
      Appointment.count({
        where: {
          status: { [Op.ne]: 'CANCELLED' },
          start_datetime: {
            [Op.between]: [
              new Date(new Date().setHours(0,0,0,0)),
              new Date(new Date().setHours(23,59,59,999)),
            ],
          },
        },
      }),
    ]);

    // Appuntamenti per giorno (ultimi 7 giorni)
    const dailyData = await Appointment.findAll({
      where: {
        status: { [Op.ne]: 'CANCELLED' },
        start_datetime: { [Op.gte]: (() => { const d = new Date(); d.setDate(d.getDate()-6); d.setHours(0,0,0,0); return d; })() },
      },
      attributes: [
        [fn('DATE', col('start_datetime')), 'date'],
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('price_snapshot')), 'revenue'],
      ],
      group: [fn('DATE', col('start_datetime'))],
      order: [[fn('DATE', col('start_datetime')), 'ASC']],
      raw: true,
    });

    // Top barbieri per appuntamenti nel periodo
    const topBarbers = await Appointment.findAll({
      where,
      attributes: ['barber_id', [fn('COUNT', col('Appointment.id')), 'count']],
      include: [{
        model: Barber, as: 'barber', attributes: [],
        include: [{ model: User, as: 'user', attributes: ['first_name','last_name'] }],
      }],
      group: ['barber_id','barber.id','barber->user.id'],
      order: [[fn('COUNT', col('Appointment.id')), 'DESC']],
      limit: 5,
    });

    const totalUsers = await User.count({ where: { role: 'CLIENT', is_active: true } });

    res.json({
      data: {
        period,
        totalAppointments: totalApts,
        revenue: revenue || 0,
        todayAppointments: todayApts,
        totalClients: totalUsers,
        byStatus: byStatus.reduce((acc, r) => { acc[r.status] = parseInt(r.count); return acc; }, {}),
        dailyData,
        topBarbers,
      },
    });
  } catch (err) { next(err); }
}

// GET /api/admin/users
async function getUsers(req, res, next) {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) where[Op.or] = [
      { first_name: { [Op.iLike]: `%${search}%` } },
      { last_name:  { [Op.iLike]: `%${search}%` } },
      { email:      { [Op.iLike]: `%${search}%` } },
    ];

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash','refresh_token'] },
      order: [['created_at','DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page)-1) * parseInt(limit),
    });

    res.json({ data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
}

// POST /api/admin/barbers
async function createBarber(req, res, next) {
  try {
    const { first_name, last_name, email, phone, password, bio, slot_duration, color_hex } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email già in uso' });

    const password_hash = await bcrypt.hash(password || 'ChangeMe123!', 12);

    const user = await User.create({
      first_name, last_name, email, phone,
      password_hash, role: 'BARBER', email_verified: true,
    });

    const barber = await Barber.create({
      user_id: user.id, bio, slot_duration: slot_duration || 30,
      color_hex: color_hex || '#c9a84c',
    });

    res.status(201).json({
      data: { user: { id: user.id, first_name, last_name, email }, barber },
    });
  } catch (err) { next(err); }
}

// PUT /api/admin/barbers/:id
async function updateBarber(req, res, next) {
  try {
    const barber = await Barber.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }],
    });
    if (!barber) return res.status(404).json({ error: 'Barbiere non trovato' });

    const { first_name, last_name, phone, bio, slot_duration, color_hex, is_accepting } = req.body;

    await barber.user.update({ first_name, last_name, phone });
    await barber.update({ bio, slot_duration, color_hex, is_accepting });

    res.json({ data: barber });
  } catch (err) { next(err); }
}

// DELETE /api/admin/users/:id
async function deactivateUser(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    if (user.id === req.user.id) return res.status(400).json({ error: 'Non puoi disattivare te stesso' });
    await user.update({ is_active: false });
    res.json({ message: 'Utente disattivato' });
  } catch (err) { next(err); }
}

// GET /api/admin/appointments (tutti, con filtri avanzati)
async function getAllAppointments(req, res, next) {
  try {
    const { barber_id, date_from, date_to, status, page = 1, limit = 50 } = req.query;
    const where = {};

    if (barber_id)  where.barber_id = barber_id;
    if (status)     where.status    = status;
    if (date_from || date_to) {
      where.start_datetime = {};
      if (date_from) where.start_datetime[Op.gte] = new Date(date_from);
      if (date_to)   where.start_datetime[Op.lte] = new Date(date_to + 'T23:59:59');
    }

    const { count, rows } = await Appointment.findAndCountAll({
      where,
      include: [
        { model: User, as: 'client', attributes: ['id','first_name','last_name','email','phone'] },
        { model: Service, as: 'service', attributes: ['id','name','price','duration_minutes'] },
        {
          model: Barber, as: 'barber', attributes: ['id','color_hex'],
          include: [{ model: User, as: 'user', attributes: ['first_name','last_name'] }],
        },
      ],
      order: [['start_datetime','DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page)-1) * parseInt(limit),
    });

    res.json({ data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
}

module.exports = { getStats, getUsers, createBarber, updateBarber, deactivateUser, getAllAppointments };
