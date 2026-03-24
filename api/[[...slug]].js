/**
 * Proxy /api/* → backend Express (evita 405 su Vercel: il rewrite SPA non accetta POST).
 * Imposta su Vercel: API_ORIGIN = URL del backend senza slash finale (es. https://xxx.up.railway.app)
 */
module.exports = async function handler(req, res) {
  const origin = process.env.API_ORIGIN?.replace(/\/$/, '');
  if (!origin) {
    return res.status(500).json({
      error:
        'API_ORIGIN non configurato. In Vercel → Environment Variables aggiungi API_ORIGIN con l’URL del backend (es. https://tuoprogetto.up.railway.app).',
    });
  }

  let pathname;
  let search = '';
  try {
    const u = new URL(req.url, 'http://localhost');
    pathname = u.pathname;
    search = u.search;
  } catch {
    const [p, ...q] = String(req.url || '').split('?');
    pathname = p;
    search = q.length ? `?${q.join('?')}` : '';
  }

  if (!pathname.startsWith('/api')) {
    const slug = req.query?.slug;
    const segments =
      slug === undefined ? [] : Array.isArray(slug) ? slug : [slug];
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
      const body =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      init.body = body;
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
