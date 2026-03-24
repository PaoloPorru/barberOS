const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ─── USER ────────────────────────────────────────────────────

const User = sequelize.define('User', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  first_name:     { type: DataTypes.STRING(100), allowNull: false },
  last_name:      { type: DataTypes.STRING(100), allowNull: false },
  email:          { type: DataTypes.STRING(255), allowNull: false, unique: true,
                    validate: { isEmail: true } },
  phone:          { type: DataTypes.STRING(20) },
  password_hash:  { type: DataTypes.STRING(255), allowNull: false },
  role:           { type: DataTypes.ENUM('CLIENT', 'BARBER', 'ADMIN'), defaultValue: 'CLIENT' },
  is_active:      { type: DataTypes.BOOLEAN, defaultValue: true },
  refresh_token:  { type: DataTypes.TEXT },
  email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'users' });

// ─── BARBER ──────────────────────────────────────────────────

const Barber = sequelize.define('Barber', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:       { type: DataTypes.UUID, allowNull: false, unique: true },
  bio:           { type: DataTypes.TEXT },
  photo_url:     { type: DataTypes.STRING(500) },
  slot_duration: { type: DataTypes.INTEGER, defaultValue: 30 },
  is_accepting:  { type: DataTypes.BOOLEAN, defaultValue: true },
  color_hex:     { type: DataTypes.STRING(7), defaultValue: '#c9a84c' },
}, { tableName: 'barbers', updatedAt: false });

// ─── SERVICE ─────────────────────────────────────────────────

const Service = sequelize.define('Service', {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:             { type: DataTypes.STRING(100), allowNull: false },
  description:      { type: DataTypes.TEXT },
  price:            { type: DataTypes.DECIMAL(8, 2), allowNull: false },
  duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
  is_active:        { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'services' });

// ─── AVAILABILITY ────────────────────────────────────────────

const Availability = sequelize.define('Availability', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  barber_id:   { type: DataTypes.UUID, allowNull: false },
  day_of_week: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0, max: 6 } },
  start_time:  { type: DataTypes.TIME, allowNull: false },
  end_time:    { type: DataTypes.TIME, allowNull: false },
  is_active:   { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'availability', timestamps: false });

// ─── BLOCKED SLOT ────────────────────────────────────────────

const BlockedSlot = sequelize.define('BlockedSlot', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  barber_id:      { type: DataTypes.UUID, allowNull: false },
  start_datetime: { type: DataTypes.DATE, allowNull: false },
  end_datetime:   { type: DataTypes.DATE, allowNull: false },
  reason:         { type: DataTypes.STRING(255) },
}, { tableName: 'blocked_slots', updatedAt: false });

// ─── APPOINTMENT ─────────────────────────────────────────────

const Appointment = sequelize.define('Appointment', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  client_id:      { type: DataTypes.UUID, allowNull: false },
  barber_id:      { type: DataTypes.UUID, allowNull: false },
  service_id:     { type: DataTypes.UUID, allowNull: false },
  start_datetime: { type: DataTypes.DATE, allowNull: false },
  end_datetime:   { type: DataTypes.DATE, allowNull: false },
  status:         { type: DataTypes.ENUM('PENDING','CONFIRMED','CANCELLED','COMPLETED'),
                    defaultValue: 'CONFIRMED' },
  price_snapshot: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
  notes:          { type: DataTypes.TEXT },
  reminder_sent:  { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'appointments' });

// ─── AUDIT LOG ───────────────────────────────────────────────

const AuditLog = sequelize.define('AuditLog', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:    { type: DataTypes.UUID },
  action:     { type: DataTypes.STRING(100), allowNull: false },
  entity:     { type: DataTypes.STRING(50), allowNull: false },
  entity_id:  { type: DataTypes.UUID },
  payload:    { type: DataTypes.JSONB },
  ip_address: { type: DataTypes.INET },
}, { tableName: 'audit_logs', updatedAt: false });

// ─── ASSOCIATIONS ────────────────────────────────────────────

Barber.belongsTo(User,         { foreignKey: 'user_id', as: 'user' });
User.hasOne(Barber,            { foreignKey: 'user_id', as: 'barberProfile' });

Availability.belongsTo(Barber, { foreignKey: 'barber_id', as: 'barber' });
Barber.hasMany(Availability,   { foreignKey: 'barber_id', as: 'availability' });

BlockedSlot.belongsTo(Barber,  { foreignKey: 'barber_id', as: 'barber' });
Barber.hasMany(BlockedSlot,    { foreignKey: 'barber_id', as: 'blockedSlots' });

Appointment.belongsTo(User,    { foreignKey: 'client_id', as: 'client' });
Appointment.belongsTo(Barber,  { foreignKey: 'barber_id', as: 'barber' });
Appointment.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

User.hasMany(Appointment,      { foreignKey: 'client_id', as: 'appointments' });
Barber.hasMany(Appointment,    { foreignKey: 'barber_id', as: 'appointments' });

module.exports = { User, Barber, Service, Availability, BlockedSlot, Appointment, AuditLog };
