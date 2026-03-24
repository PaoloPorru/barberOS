const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const messages = error.details.map((d) => d.message).join(', ');
    return res.status(400).json({ error: messages });
  }
  req.body = value;
  next();
};

// ─── SCHEMAS ─────────────────────────────────────────────────

const schemas = {
  register: Joi.object({
    first_name: Joi.string().min(2).max(100).required(),
    last_name:  Joi.string().min(2).max(100).required(),
    email:      Joi.string().email().lowercase().required(),
    phone:      Joi.string().pattern(/^\+?[\d\s\-()]{6,20}$/).optional(),
    password:   Joi.string().min(8).max(72).required(),
  }),

  login: Joi.object({
    email:    Joi.string().email().lowercase().required(),
    password: Joi.string().required(),
  }),

  createAppointment: Joi.object({
    barber_id:      Joi.string().uuid().required(),
    service_id:     Joi.string().uuid().required(),
    start_datetime: Joi.string().isoDate().required(),
    notes:          Joi.string().max(500).optional().allow(''),
  }),

  updateAppointment: Joi.object({
    barber_id:      Joi.string().uuid().optional(),
    service_id:     Joi.string().uuid().optional(),
    start_datetime: Joi.string().isoDate().optional(),
    notes:          Joi.string().max(500).optional().allow(''),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('CONFIRMED', 'CANCELLED', 'COMPLETED').required(),
  }),

  createService: Joi.object({
    name:             Joi.string().min(2).max(100).required(),
    description:      Joi.string().max(500).optional().allow(''),
    price:            Joi.number().min(0).max(9999).required(),
    duration_minutes: Joi.number().integer().min(5).max(480).required(),
  }),

  setAvailability: Joi.object({
    availability: Joi.array().items(Joi.object({
      day_of_week: Joi.number().integer().min(0).max(6).required(),
      start_time:  Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
      end_time:    Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
      is_active:   Joi.boolean().optional(),
    })).required(),
  }),

  blockSlot: Joi.object({
    start_datetime: Joi.string().isoDate().required(),
    end_datetime:   Joi.string().isoDate().required(),
    reason:         Joi.string().max(255).optional().allow(''),
  }),
};

module.exports = { validate, schemas };
