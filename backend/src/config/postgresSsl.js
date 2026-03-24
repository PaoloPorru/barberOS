/**
 * SSL per Postgres in cloud (Neon, Supabase, Render, Railway, …).
 * Disabilita con DATABASE_SSL=false.
 */
function needsSsl(connectionString) {
  const url = connectionString || '';
  if (process.env.DATABASE_SSL === 'false') return false;
  if (process.env.DATABASE_SSL === 'true') return true;
  return /neon\.tech|supabase\.co|pooler\.supabase|\.render\.com|railway\.app|aiven\.cloud|[?&]sslmode=require/i.test(
    url
  );
}

function sslForPg(connectionString) {
  return needsSsl(connectionString) ? { rejectUnauthorized: false } : undefined;
}

function sslForSequelize(connectionString) {
  return needsSsl(connectionString)
    ? { require: true, rejectUnauthorized: false }
    : undefined;
}

module.exports = { needsSsl, sslForPg, sslForSequelize };
