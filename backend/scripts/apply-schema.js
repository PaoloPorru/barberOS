#!/usr/bin/env node
/**
 * Applica database/001_schema.sql (idempotente: ok ripeterlo su ogni deploy Render).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { sslForPg } = require('../src/config/postgresSsl');
const { splitSqlStatements } = require('./split-sql');

/** Errori PG da ignorare se lo schema è già stato applicato */
function isAlreadyApplied(err) {
  const code = err && err.code;
  const msg = String((err && err.message) || '').toLowerCase();
  if (['42P07', '42710', '42P06'].includes(code)) return true;
  if (msg.includes('already exists')) return true;
  return false;
}

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
  let applied = 0;
  let skipped = 0;
  try {
    for (const stmt of statements) {
      try {
        await client.query(stmt);
        applied += 1;
      } catch (e) {
        if (isAlreadyApplied(e)) {
          skipped += 1;
          continue;
        }
        throw e;
      }
    }
    console.log(`Schema: ${applied} statement eseguiti, ${skipped} già presenti (skip).`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
