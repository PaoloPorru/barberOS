#!/usr/bin/env node
/**
 * Applica database/002_seed.sql (dati demo). Esegui dopo migrate.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { sslForPg } = require('../src/config/postgresSsl');
const { splitSqlStatements } = require('./split-sql');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Manca DATABASE_URL');
    process.exit(1);
  }

  const seedPath = path.join(__dirname, '../../database/002_seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');
  const statements = splitSqlStatements(sql).filter(Boolean);

  const ssl = sslForPg(url);
  const client = new Client({
    connectionString: url,
    ...(ssl ? { ssl } : {}),
  });

  await client.connect();
  try {
    for (const stmt of statements) {
      await client.query(stmt);
    }
    console.log('Seed applicato:', statements.length, 'statement');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
