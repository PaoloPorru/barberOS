const { Op } = require('sequelize');
const redis = require('../config/redis');
const { Availability, Appointment, BlockedSlot, Service } = require('../models');

/**
 * Genera tutti gli slot temporali tra startTime e endTime
 * con step di durationMin minuti
 */
function generateSlots(dateStr, startTime, endTime, durationMin) {
  const slots = [];
  let current = new Date(`${dateStr}T${startTime}:00`);
  const end   = new Date(`${dateStr}T${endTime}:00`);

  while (current < end) {
    const slotEnd = new Date(current.getTime() + durationMin * 60_000);
    if (slotEnd <= end) {
      slots.push({
        start: new Date(current),
        end:   slotEnd,
        label: current.toTimeString().slice(0, 5),
      });
    }
    current = slotEnd;
  }
  return slots;
}

/**
 * Controlla se due intervalli si sovrappongono
 */
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Ritorna gli slot disponibili per un barbiere in una data,
 * tenendo conto della durata del servizio richiesto.
 */
async function getAvailableSlots({ barberId, date, serviceId }) {
  const cacheKey = `slots:${barberId}:${date}:${serviceId}`;

  // 1. Cache Redis
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}

  // 2. Durata servizio
  const service = await Service.findByPk(serviceId);
  if (!service || !service.is_active) throw new Error('Servizio non disponibile');
  const duration = service.duration_minutes;

  // 3. Giorno settimana per la data richiesta
  const dayOfWeek = new Date(date + 'T12:00:00').getDay(); // 0=Dom

  // 4. Disponibilità settimanale del barbiere
  const availRows = await Availability.findAll({
    where: { barber_id: barberId, day_of_week: dayOfWeek, is_active: true },
  });
  if (!availRows.length) return [];

  // 5. Appuntamenti già confermati in quella giornata
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd   = new Date(`${date}T23:59:59`);

  const existingApts = await Appointment.findAll({
    where: {
      barber_id: barberId,
      status: { [Op.ne]: 'CANCELLED' },
      start_datetime: { [Op.between]: [dayStart, dayEnd] },
    },
    attributes: ['start_datetime', 'end_datetime'],
  });

  // 6. Slot bloccati manualmente
  const blockedSlots = await BlockedSlot.findAll({
    where: {
      barber_id: barberId,
      start_datetime: { [Op.lte]: dayEnd },
      end_datetime:   { [Op.gte]: dayStart },
    },
    attributes: ['start_datetime', 'end_datetime'],
  });

  const busyIntervals = [
    ...existingApts.map(a => ({ start: new Date(a.start_datetime), end: new Date(a.end_datetime) })),
    ...blockedSlots.map(b => ({ start: new Date(b.start_datetime), end: new Date(b.end_datetime) })),
  ];

  // 7. Genera tutti gli slot dalle finestre di disponibilità e filtra
  const now = new Date();
  const allSlots = [];

  for (const avail of availRows) {
    const slots = generateSlots(date, avail.start_time.slice(0, 5), avail.end_time.slice(0, 5), duration);
    allSlots.push(...slots);
  }

  const availableSlots = allSlots.filter(slot => {
    // Non mostrare slot nel passato
    if (slot.start <= now) return false;
    // Controlla sovrapposizioni
    return !busyIntervals.some(busy => overlaps(slot.start, slot.end, busy.start, busy.end));
  });

  // 8. Salva in cache per 60 secondi
  try {
    await redis.setex(cacheKey, 60, JSON.stringify(availableSlots));
  } catch {}

  return availableSlots;
}

/**
 * Invalida la cache per un barbiere in una data specifica
 */
async function invalidateCache(barberId, dateStr) {
  try {
    const keys = await redis.keys(`slots:${barberId}:${dateStr}:*`);
    if (keys.length) await redis.del(...keys);
  } catch {}
}

module.exports = { getAvailableSlots, invalidateCache, generateSlots, overlaps };
