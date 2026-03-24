require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const { sequelize } = require('./config/database');
const logger = require('./config/logger');
const rateLimiter = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const slotRoutes = require('./routes/slots');
const barberRoutes = require('./routes/barbers');
const serviceRoutes = require('./routes/services');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');

const app = express();

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── GENERAL MIDDLEWARE ───────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// ─── RATE LIMITING ────────────────────────────────────────────
app.use('/api/', rateLimiter.general);
app.use('/api/auth/', rateLimiter.auth);

// ─── ROUTES ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method}`);

  if (err.name === 'ValidationError' || err.isJoi) {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── START ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connected');

    app.listen(PORT, () => {
      logger.info(`🚀 BarberOS API running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('❌ Unable to start:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
