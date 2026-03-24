const { getAvailableSlots } = require('../services/slotService');

// GET /api/slots?barber_id=&date=&service_id=
async function getSlots(req, res, next) {
  try {
    const { barber_id, date, service_id } = req.query;

    if (!barber_id || !date || !service_id) {
      return res.status(400).json({ error: 'barber_id, date e service_id sono obbligatori' });
    }

    // Validazione data
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ error: 'Formato data non valido (usa YYYY-MM-DD)' });
    }

    const slots = await getAvailableSlots({ barberId: barber_id, date, serviceId: service_id });
    res.json({ data: slots });
  } catch (err) {
    if (err.message === 'Servizio non disponibile') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

module.exports = { getSlots };
