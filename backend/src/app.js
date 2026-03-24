require('dotenv').config();
const path = require('path');
const { spawn } = require('child_process');
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

/** Render / Vercel: IP reale e rate limit corretti dietro proxy. */
app.set('trust proxy', 1);

/** Fino a quando migrate + DB non sono pronti, /api risponde 503 (evita richieste “pending” su Render). */
global.__DB_READY__ = false;

function normalizeOrigin(o) {
  return String(o || '')
    .trim()
    .replace(/\/+$/, '');
}

function corsAllowedOrigins() {
  const raw = process.env.FRONTEND_URL || 'http://localhost:5173';
  return raw.split(',').map((s) => normalizeOrigin(s)).filter(Boolean);
}

function isVercelAppOrigin(origin) {
  const o = normalizeOrigin(origin);
  return /^https:\/\/[a-z0-9][\w.-]*\.vercel\.app$/i.test(o);
}

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────
// API chiamata da altro dominio (Vercel → Render): niente COOP/CSP di default su JSON,
// e CORP cross-origin (altrimenti il browser può non esporre la risposta al JS).
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const o = normalizeOrigin(origin);
      const list = corsAllowedOrigins();
      if (list.includes(o)) return callback(null, o);
      if (process.env.CORS_ALLOW_VERCEL === '1' && isVercelAppOrigin(o)) {
        return callback(null, o);
      }
      logger.warn(
        `CORS: Origin non in lista. Ricevuto "${o}". Su Render imposta FRONTEND_URL uguale all’URL del browser (es. https://tuo-progetto.vercel.app), senza slash finale. Più URL: separali con virgola. Anteprime Vercel: imposta anche CORS_ALLOW_VERCEL=1 oppure aggiungi l’URL esatto.`
      );
      callback(new Error('CORS: origine non consentita'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
);

// ─── GENERAL MIDDLEWARE ───────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  if (!global.__DB_READY__) {
    return res.status(503).json({ error: 'Servizio in avvio, riprova tra pochi secondi.' });
  }
  next();
});

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
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    databaseReady: !!global.__DB_READY__,
  });
});

// ─── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method}`);

  if (String(err.message || '').startsWith('CORS:')) {
    return res.status(403).json({
      error:
        'Origine non autorizzata. Su Render imposta FRONTEND_URL uguale all’URL del browser (senza / finale). Per anteprime Vercel usa CORS_ALLOW_VERCEL=1 o aggiungi l’URL in FRONTEND_URL.',
      code: 'CORS_ORIGIN',
    });
  }

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

/** Su Render (piano free) non c’è Shell / pre-deploy: migrazione idempotente all’avvio (async, non blocca listen). */
function runSchemaMigrateIfCloudAsync() {
  if (process.env.SKIP_AUTO_MIGRATE === '1') return Promise.resolve();
  if (!process.env.RENDER && process.env.AUTO_MIGRATE !== '1') return Promise.resolve();
  const backendRoot = path.join(__dirname, '..');
  const script = path.join(backendRoot, 'scripts', 'apply-schema.js');
  logger.info('Applicazione schema SQL (auto, idempotente)…');
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: backendRoot,
      env: process.env,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`migrate terminata con codice ${code}`));
    });
  });
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
    const server = app.listen(PORT, () => {
      logger.info(`🚀 BarberOS API running on port ${PORT}`);
    });
    server.requestTimeout = 125_000;
    server.headersTimeout = 130_000;

    await runSchemaMigrateIfCloudAsync();
    await sequelize.authenticate();
    logger.info('✅ Database connected');
    global.__DB_READY__ = true;
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
