const rateLimit = require('express-rate-limit');

const validateRelaxed = {
  ip: false,
  trustProxy: false,
  xForwardedForHeader: false,
};

const general = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Troppe richieste, riprova tra qualche minuto.' },
  validate: validateRelaxed,
  skip: (req) => req.method === 'OPTIONS',
  keyGenerator: (req) => req.ip || req.socket?.remoteAddress || '127.0.0.1',
});

const auth = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 10,
  message: { error: 'Troppi tentativi di accesso, riprova tra un\'ora.' },
  skipSuccessfulRequests: true,
  validate: validateRelaxed,
  skip: (req) => req.method === 'OPTIONS',
  keyGenerator: (req) => req.ip || req.socket?.remoteAddress || '127.0.0.1',
});

module.exports = { general, auth };
