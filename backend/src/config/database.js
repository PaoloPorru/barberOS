const { Sequelize } = require('sequelize');
const logger = require('./logger');
const { sslForSequelize } = require('./postgresSsl');

const ssl = sslForSequelize(process.env.DATABASE_URL);

const dialectOptions = {
  connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS) || 20000,
  ...(ssl ? { ssl } : {}),
};

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions,
  logging: (sql) => process.env.NODE_ENV === 'development' && logger.debug(sql),
  pool: {
    max: 10,
    min: Number(process.env.PG_POOL_MIN) || 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

module.exports = { sequelize };
