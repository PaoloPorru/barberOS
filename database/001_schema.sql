-- ============================================================
-- BARBEROS — Schema PostgreSQL Completo
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUM TYPES ─────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('CLIENT', 'BARBER', 'ADMIN');
CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- ─── USERS ──────────────────────────────────────────────────

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  phone           VARCHAR(20),
  password_hash   VARCHAR(255) NOT NULL,
  role            user_role NOT NULL DEFAULT 'CLIENT',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  refresh_token   TEXT,
  email_verified  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);

-- ─── BARBERS ────────────────────────────────────────────────

CREATE TABLE barbers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio             TEXT,
  photo_url       VARCHAR(500),
  slot_duration   INTEGER NOT NULL DEFAULT 30 CHECK (slot_duration > 0),
  is_accepting    BOOLEAN NOT NULL DEFAULT true,
  color_hex       VARCHAR(7) NOT NULL DEFAULT '#c9a84c',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_barbers_user_id ON barbers (user_id);

-- ─── SERVICES ───────────────────────────────────────────────

CREATE TABLE services (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(100) NOT NULL,
  description       TEXT,
  price             DECIMAL(8, 2) NOT NULL CHECK (price >= 0),
  duration_minutes  INTEGER NOT NULL CHECK (duration_minutes > 0),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AVAILABILITY ───────────────────────────────────────────

CREATE TABLE availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id    UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT check_times CHECK (end_time > start_time),
  CONSTRAINT unique_barber_day UNIQUE (barber_id, day_of_week)
);

CREATE INDEX idx_availability_barber_day ON availability (barber_id, day_of_week) WHERE is_active = true;

-- ─── BLOCKED SLOTS ──────────────────────────────────────────

CREATE TABLE blocked_slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id       UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  start_datetime  TIMESTAMPTZ NOT NULL,
  end_datetime    TIMESTAMPTZ NOT NULL,
  reason          VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_block_times CHECK (end_datetime > start_datetime)
);

CREATE INDEX idx_blocked_slots_barber ON blocked_slots (barber_id, start_datetime);

-- ─── APPOINTMENTS ───────────────────────────────────────────

CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  barber_id       UUID NOT NULL REFERENCES barbers(id) ON DELETE RESTRICT,
  service_id      UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  start_datetime  TIMESTAMPTZ NOT NULL,
  end_datetime    TIMESTAMPTZ NOT NULL,
  status          appointment_status NOT NULL DEFAULT 'CONFIRMED',
  price_snapshot  DECIMAL(8, 2) NOT NULL,
  notes           TEXT,
  reminder_sent   BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_apt_times CHECK (end_datetime > start_datetime)
);

CREATE INDEX idx_appointments_barber_date ON appointments (barber_id, start_datetime);
CREATE INDEX idx_appointments_client ON appointments (client_id, status);
CREATE INDEX idx_appointments_date ON appointments (start_datetime);

-- Unique index to prevent double booking at DB level
CREATE UNIQUE INDEX idx_no_overlap
  ON appointments (barber_id, start_datetime)
  WHERE status != 'CANCELLED';

-- ─── AUDIT LOG ──────────────────────────────────────────────

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity      VARCHAR(50) NOT NULL,
  entity_id   UUID,
  payload     JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs (user_id, created_at);
CREATE INDEX idx_audit_entity ON audit_logs (entity, entity_id);

-- ─── UPDATED_AT TRIGGER ─────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
