#!/usr/bin/env node
/**
 * Applica database/001_schema.sql al DB indicato da DATABASE_URL (una tantum su DB vuoto).
 * Uso dalla root del repo: cd backend && DATABASE_URL=... npm run migrate
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

  const schemaPath = path.join(__dirname, '../../database/001_schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
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
    console.log('Schema applicato:', statements.length, 'statement');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
