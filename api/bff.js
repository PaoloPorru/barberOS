/**
 * Proxy BFF — rewrite: /api/(.*) → /api/bff?forward=$1
 * Timeout + anti-loop: stesso host Vercel come API_ORIGIN = richiesta infinita.
 */
const UPSTREAM_MS = Number(process.env.BFF_UPSTREAM_TIMEOUT_MS) || 120_000;

function readRequestBody(req) {
  if (req.body === undefined || req.body === null) return undefined;
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'object') return JSON.stringify(req.body);
  return String(req.body);
}

module.exports = async (req, res) => {
  const origin = String(process.env.API_ORIGIN || process.env.BACKEND_URL || '')
    .trim()
    .replace(/\/$/, '');

  if (!origin) {
    return res.status(500).json({
      error: 'API_ORIGIN mancante',
      hint:
        'Imposta l’URL del backend Render (es. https://xxx.onrender.com), NON il dominio Vercel. Oppure VITE_API_BASE_URL sul build.',
    });
  }

  let originHost;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return res.status(500).json({ error: 'API_ORIGIN non è un URL valido' });
  }

  const requestHost = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim()
    .toLowerCase();

  if (originHost && requestHost && originHost === requestHost) {
    return res.status(500).json({
      error: 'API_ORIGIN uguale al sito Vercel',
      hint:
        'Stai puntando al frontend invece che a Render. API_ORIGIN deve essere tipo https://TUO-SERVIZIO.onrender.com (senza / finale).',
    });
  }

  const host = req.headers.host || 'localhost';
  let pathname;
  let search = '';
  try {
    const u = new URL(req.url, `http://${host}`);
    const forwardRaw = u.searchParams.get('forward');
    const forward = forwardRaw
      ? String(forwardRaw)
          .split('/')
          .filter(Boolean)
          .join('/')
      : '';

    u.searchParams.delete('forward');
    const rest = u.searchParams.toString();
    search = rest ? `?${rest}` : '';

    if (u.pathname === '/api/bff' || u.pathname.startsWith('/api/bff')) {
      pathname = forward ? `/api/${forward}` : '/api';
    } else {
      pathname = u.pathname;
      search = u.search || '';
    }
  } catch {
    return res.status(400).json({ error: 'URL non valido' });
  }

  const targetUrl = `${origin}${pathname}${search}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase();
    if (
      [
        'host',
        'connection',
        'content-length',
        'transfer-encoding',
        'keep-alive',
        'x-forwarded-host',
        'x-forwarded-proto',
        'x-vercel-id',
        'x-vercel-deployment-url',
      ].includes(lower)
    ) {
      continue;
    }
    if (value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }

  const init = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const raw = readRequestBody(req);
    if (raw !== undefined && raw !== null && String(raw).length) {
      init.body = typeof raw === 'string' || Buffer.isBuffer(raw) ? raw : String(raw);
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
    }
  }

  const ac = new AbortController();
  const kill = setTimeout(() => ac.abort(), UPSTREAM_MS);

  try {
    const r = await fetch(targetUrl, { ...init, signal: ac.signal });
    const text = await r.text();
    res.status(r.status);
    const skip = new Set([
      'connection',
      'content-encoding',
      'transfer-encoding',
      'keep-alive',
    ]);
    r.headers.forEach((v, k) => {
      if (!skip.has(k.toLowerCase())) res.setHeader(k, v);
    });
    res.send(text);
  } catch (e) {
    if (e.name === 'AbortError' || e.code === 'ABORT_ERR') {
      return res.status(504).json({
        error: 'Timeout verso il backend',
        hint:
          'Render free può impiegare 1–2 minuti al risveglio. Riprova. Verifica che API_ORIGIN sia l’URL onrender.com corretto.',
      });
    }
    res.status(502).json({
      error: 'Backend non raggiungibile',
      detail: String(e?.message || e),
    });
  } finally {
    clearTimeout(kill);
  }
};
