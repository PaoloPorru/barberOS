/**
 * Intercetta /api/* prima del rewrite SPA (che su POST verso /api restituisce 405).
 * Vercel → Environment Variables: API_ORIGIN = URL backend senza slash finale
 * (es. https://barberos-production.up.railway.app)
 */
export const config = {
  matcher: ['/api', '/api/:path*'],
};

export default async function middleware(request) {
  const raw = process.env.API_ORIGIN || process.env.BACKEND_URL;
  if (!raw || !String(raw).trim()) {
    return Response.json(
      {
        error:
          'Imposta API_ORIGIN o BACKEND_URL su Vercel (Settings → Environment Variables). Esempio: https://tuobackend.up.railway.app',
      },
      { status: 500 }
    );
  }

  const base = String(raw).replace(/\/$/, '');
  const src = new URL(request.url);
  const targetUrl = `${base}${src.pathname}${src.search}`;

  const outHeaders = new Headers(request.headers);
  outHeaders.delete('host');
  outHeaders.delete('connection');

  /** @type {RequestInit} */
  const init = {
    method: request.method,
    headers: outHeaders,
    redirect: 'manual',
  };

  if (!['GET', 'HEAD'].includes(request.method) && request.body != null) {
    init.body = request.body;
  }

  let backendRes;
  try {
    backendRes = await fetch(targetUrl, init);
  } catch (e) {
    return Response.json(
      { error: 'Backend non raggiungibile', detail: String(e?.message || e) },
      { status: 502 }
    );
  }

  const respHeaders = new Headers(backendRes.headers);
  respHeaders.delete('connection');
  respHeaders.delete('transfer-encoding');

  return new Response(backendRes.body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: respHeaders,
  });
}
