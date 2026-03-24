-- ============================================================
-- BARBEROS — Seed Data
-- Password per tutti gli utenti: "Password123!"
-- Hash bcrypt generato con saltRounds=12
-- ============================================================

-- Admin
INSERT INTO users (id, first_name, last_name, email, phone, password_hash, role, email_verified)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Admin', 'BarberOS',
  'admin@barberos.it', '+39 02 1234567',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TJFgvxXCLON5Z1TeCbOVfX0rT8e2',
  'ADMIN', true
);

-- Barbieri
INSERT INTO users (id, first_name, last_name, email, phone, password_hash, role, email_verified) VALUES
('b0000000-0000-0000-0000-000000000001', 'Marco', 'Rossi', 'marco@barberos.it', '+39 333 1111111',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TJFgvxXCLON5Z1TeCbOVfX0rT8e2', 'BARBER', true),
('b0000000-0000-0000-0000-000000000002', 'Luca', 'Ferrari', 'luca@barberos.it', '+39 333 2222222',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TJFgvxXCLON5Z1TeCbOVfX0rT8e2', 'BARBER', true),
('b0000000-0000-0000-0000-000000000003', 'Antonio', 'Esposito', 'antonio@barberos.it', '+39 333 3333333',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TJFgvxXCLON5Z1TeCbOVfX0rT8e2', 'BARBER', true);

-- Profili barbieri
INSERT INTO barbers (id, user_id, bio, slot_duration, color_hex) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 'Specializzato in tagli classici e fade. 10 anni di esperienza.', 30, '#c9a84c'),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002',
 'Expert in beard grooming e tagli moderni. Certificato barbiere europeo.', 30, '#4caf78'),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003',
 'Specializzato in tagli etnici e trattamenti capelli ricci.', 30, '#5c8fe0');

-- Clienti di test
INSERT INTO users (id, first_name, last_name, email, phone, password_hash, role, email_verified) VALUES
('d0000000-0000-0000-0000-000000000001', 'Giovanni', 'Bianchi', 'giovanni@test.it', '+39 347 1111111',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TJFgvxXCLON5Z1TeCbOVfX0rT8e2', 'CLIENT', true),
('d0000000-0000-0000-0000-000000000002', 'Paolo', 'Conti', 'paolo@test.it', '+39 347 2222222',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TJFgvxXCLON5Z1TeCbOVfX0rT8e2', 'CLIENT', true);

-- Servizi
INSERT INTO services (id, name, description, price, duration_minutes) VALUES
('e0000000-0000-0000-0000-000000000001', 'Taglio Classico', 'Taglio capelli con forbici o macchinetta, lavaggio e asciugatura inclusi.', 18.00, 30),
('e0000000-0000-0000-0000-000000000002', 'Taglio + Barba', 'Taglio capelli e rifilatura barba completa con rasoio.', 28.00, 45),
('e0000000-0000-0000-0000-000000000003', 'Solo Barba', 'Rifilatura e modellatura barba con rasoio e prodotti premium.', 15.00, 20),
('e0000000-0000-0000-0000-000000000004', 'Taglio Bambino', 'Taglio capelli per bambini fino a 12 anni.', 12.00, 20),
('e0000000-0000-0000-0000-000000000005', 'Trattamento Capelli', 'Maschera nutriente, massaggio cuoio capelluto e styling.', 35.00, 60),
('e0000000-0000-0000-0000-000000000006', 'Combo Premium', 'Taglio + barba + trattamento capelli. Il pacchetto completo.', 55.00, 90);

-- Disponibilità barbieri (Lun-Sab 9:00-19:00, Dom chiuso)
INSERT INTO availability (barber_id, day_of_week, start_time, end_time) VALUES
-- Marco (barber 1): Lun-Sab
('c0000000-0000-0000-0000-000000000001', 1, '09:00', '13:00'),
('c0000000-0000-0000-0000-000000000001', 1, '14:00', '19:00'),
('c0000000-0000-0000-0000-000000000001', 2, '09:00', '13:00'),
('c0000000-0000-0000-0000-000000000001', 2, '14:00', '19:00'),
('c0000000-0000-0000-0000-000000000001', 3, '09:00', '13:00'),
('c0000000-0000-0000-0000-000000000001', 3, '14:00', '19:00'),
('c0000000-0000-0000-0000-000000000001', 4, '09:00', '13:00'),
('c0000000-0000-0000-0000-000000000001', 4, '14:00', '19:00'),
('c0000000-0000-0000-0000-000000000001', 5, '09:00', '13:00'),
('c0000000-0000-0000-0000-000000000001', 5, '14:00', '19:00'),
('c0000000-0000-0000-0000-000000000001', 6, '09:00', '13:00');
