const { Sequelize } = require('sequelize');
const logger = require('./logger');
const { sslForSequelize } = require('./postgresSsl');

const ssl = sslForSequelize(process.env.DATABASE_URL);

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  ...(ssl ? { dialectOptions: { ssl } } : {}),
  logging: (sql) => process.env.NODE_ENV === 'development' && logger.debug(sql),
  pool: {
    max: 10,
    min: 2,
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
