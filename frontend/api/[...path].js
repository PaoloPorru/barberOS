/**
 * Proxy /api/* — copia per Vercel Root Directory = `frontend`.
 * Allineare a `api/[...path].js` in root repo.
 */
module.exports = async (req, res) => {
  const origin = String(process.env.API_ORIGIN || process.env.BACKEND_URL || '')
    .trim()
    .replace(/\/$/, '');

  if (!origin) {
    return res.status(500).json({
      error: 'API_ORIGIN mancante',
      hint:
        'Vercel → Environment Variables: API_ORIGIN. Oppure VITE_API_BASE_URL=https://…/api nel build.',
    });
  }

  let pathname;
  let search = '';
  try {
    const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    pathname = u.pathname;
    search = u.search;
  } catch {
    const [p, ...q] = String(req.url || '').split('?');
    pathname = p;
    search = q.length ? `?${q.join('?')}` : '';
  }

  if (!pathname.startsWith('/api')) {
    const seg = req.query?.path ?? req.query?.slug;
    const segments =
      seg === undefined ? [] : Array.isArray(seg) ? seg : [seg];
    pathname = segments.length ? `/api/${segments.join('/')}` : '/api';
  }

  const targetUrl = `${origin}${pathname}${search}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase();
    if (['host', 'connection', 'content-length'].includes(lower)) continue;
    if (value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }

  const init = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (req.body !== undefined && req.body !== null) {
      init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
    }
  }

  try {
    const r = await fetch(targetUrl, init);
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
    res.status(502).json({
      error: 'Backend non raggiungibile',
      detail: String(e?.message || e),
    });
  }
};
