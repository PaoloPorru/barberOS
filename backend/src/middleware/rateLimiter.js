const rateLimit = require('express-rate-limit');

const general = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Troppe richieste, riprova tra qualche minuto.' },
});

const auth = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 10,
  message: { error: 'Troppi tentativi di accesso, riprova tra un\'ora.' },
  skipSuccessfulRequests: true,
});

module.exports = { general, auth };
