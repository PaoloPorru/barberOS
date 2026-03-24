const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Verifica JWT e popola req.user
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mancante' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.userId, {
      attributes: { exclude: ['password_hash', 'refresh_token'] },
    });
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Utente non trovato o disattivato' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token scaduto', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token non valido' });
  }
};

/**
 * Verifica ruolo utente — usa dopo authenticate
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Non autenticato' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Accesso negato' });
  }
  next();
};

/**
 * Middleware opzionale: non blocca se non autenticato
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(payload.userId);
  } catch {}
  next();
};

module.exports = { authenticate, authorize, optionalAuth };
