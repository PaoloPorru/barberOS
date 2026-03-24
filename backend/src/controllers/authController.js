const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Barber } = require('../models');

function generateTokens(userId, role) {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
  return { accessToken, refreshToken };
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { first_name, last_name, email, phone, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email già in uso' });

    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const password_hash = await bcrypt.hash(password, rounds);

    const user = await User.create({ first_name, last_name, email, phone, password_hash, role: 'CLIENT' });

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    await user.update({ refresh_token: refreshToken });

    res.status(201).json({
      message: 'Registrazione completata',
      user: { id: user.id, first_name, last_name, email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) { next(err); }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenziali non valide' });

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    await user.update({ refresh_token: refreshToken });

    // Include barber profile if applicable
    let barberProfile = null;
    if (user.role === 'BARBER') {
      barberProfile = await Barber.findOne({ where: { user_id: user.id } });
    }

    res.json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        barberProfile: barberProfile ? { id: barberProfile.id, color_hex: barberProfile.color_hex } : null,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) { next(err); }
}

// POST /api/auth/refresh
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token mancante' });

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Refresh token non valido o scaduto' });
    }

    const user = await User.findByPk(payload.userId);
    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({ error: 'Token non riconosciuto' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role);
    await user.update({ refresh_token: newRefreshToken });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) { next(err); }
}

// POST /api/auth/logout
async function logout(req, res, next) {
  try {
    await req.user.update({ refresh_token: null });
    res.json({ message: 'Logout effettuato' });
  } catch (err) { next(err); }
}

// GET /api/auth/me
async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, refresh, logout, me };
