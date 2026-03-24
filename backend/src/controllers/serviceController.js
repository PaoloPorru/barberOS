const { Service } = require('../models');

// GET /api/services
async function getAll(req, res, next) {
  try {
    const services = await Service.findAll({
      where: { is_active: true },
      order: [['price', 'ASC']],
    });
    res.json({ data: services });
  } catch (err) { next(err); }
}

// GET /api/services/:id
async function getOne(req, res, next) {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ error: 'Servizio non trovato' });
    res.json({ data: service });
  } catch (err) { next(err); }
}

// POST /api/admin/services  [ADMIN]
async function create(req, res, next) {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ data: service });
  } catch (err) { next(err); }
}

// PUT /api/admin/services/:id  [ADMIN]
async function update(req, res, next) {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ error: 'Servizio non trovato' });
    await service.update(req.body);
    res.json({ data: service });
  } catch (err) { next(err); }
}

// DELETE /api/admin/services/:id  [ADMIN]
async function remove(req, res, next) {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ error: 'Servizio non trovato' });
    await service.update({ is_active: false }); // soft delete
    res.json({ message: 'Servizio disattivato' });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, remove };
