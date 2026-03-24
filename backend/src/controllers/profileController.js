const bcrypt = require('bcryptjs');
const { User } = require('../models');

// GET /api/profile
async function getProfile(req, res) {
  res.json({ data: req.user });
}

// PATCH /api/profile
async function updateProfile(req, res, next) {
  try {
    const { first_name, last_name, phone } = req.body;
    await req.user.update({ first_name, last_name, phone });
    res.json({ data: req.user });
  } catch (err) { next(err); }
}

// PATCH /api/profile/password
async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Password corrente e nuova sono obbligatorie' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'La nuova password deve essere di almeno 8 caratteri' });
    }

    const user = await User.findByPk(req.user.id);
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Password corrente non valida' });

    const hash = await bcrypt.hash(new_password, 12);
    await user.update({ password_hash: hash, refresh_token: null });

    res.json({ message: 'Password aggiornata. Effettua nuovamente il login.' });
  } catch (err) { next(err); }
}

module.exports = { getProfile, updateProfile, changePassword };
