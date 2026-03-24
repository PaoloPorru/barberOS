require('dotenv').config();
const path = require('path');
const { spawnSync } = require('child_process');
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

/** Su Render (piano free) non c’è Shell / pre-deploy: migrazione idempotente all’avvio. */
function runSchemaMigrateIfCloud() {
  if (process.env.SKIP_AUTO_MIGRATE === '1') return;
  if (!process.env.RENDER && process.env.AUTO_MIGRATE !== '1') return;
  const backendRoot = path.join(__dirname, '..');
  const script = path.join(backendRoot, 'scripts', 'apply-schema.js');
  logger.info('Applicazione schema SQL (auto, idempotente)…');
  const r = spawnSync(process.execPath, [script], {
    cwd: backendRoot,
    env: process.env,
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    throw new Error(`migrate terminata con codice ${r.status}`);
  }
}

async function start() {
  try {
    const dbUrl = process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim();
    if (!dbUrl) {
      logger.error(
        'Manca DATABASE_URL. Su Render → Environment aggiungi la connection string PostgreSQL (Neon/Supabase/Render PG).'
      );
      process.exit(1);
    }
    if (process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/i.test(dbUrl)) {
      logger.error(
        'DATABASE_URL punta a localhost: copiata da .env locale? Su Render serve l’URL del Postgres su Neon/Supabase (host tipo ep-xxx.eu-central-1.aws.neon.tech), non localhost.'
      );
      process.exit(1);
    }
    runSchemaMigrateIfCloud();
    await sequelize.authenticate();
    logger.info('✅ Database connected');

    app.listen(PORT, () => {
      logger.info(`🚀 BarberOS API running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('❌ Unable to start:', err);
    if (err.name === 'SequelizeConnectionRefusedError' || err.parent?.code === 'ECONNREFUSED') {
      logger.error(
        'Database rifiutata la connessione: controlla DATABASE_URL su Render (stringa Neon/Supabase; spesso serve ?sslmode=require).'
      );
    }
    process.exit(1);
  }
}

start();

module.exports = app;
