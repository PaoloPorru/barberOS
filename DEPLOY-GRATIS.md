# Deploy gratuito (Vercel + Render + Neon + Upstash)

Non possiamo creare account al posto tuo: segui l’ordine qui sotto.

## 1. PostgreSQL (Neon, gratis)

1. Crea un progetto su [neon.tech](https://neon.tech) e un database.
2. Copia la connection string (`DATABASE_URL`).

## 2. Redis (Upstash, gratis)

1. Crea un database Redis su [upstash.com](https://upstash.com).
2. Copia l’URL (di solito `rediss://…`) → sarà `REDIS_URL`.

## 3. Schema e seed (dal tuo PC, una tantum)

```bash
cd backend
cp .env.example .env
# Imposta in .env solo DATABASE_URL (o esporta la variabile)

export DATABASE_URL="postgresql://..."   # incolla Neon
npm install
npm run migrate
npm run seed    # opzionale: utenti demo (README credenziali)
```

## 4. API su Render (gratis)

1. [render.com](https://render.com) → **New** → **Blueprint** (oppure **Web Service**).
2. Collega il repo; se usi Blueprint, punta a `render.yaml`.
3. **Root Directory**: `backend` (se non usi il blueprint che lo imposta già).
4. In **Environment**, imposta almeno:
   - `DATABASE_URL`, `REDIS_URL`
   - `FRONTEND_URL` = `https://barber-os-ten.vercel.app` (o il tuo dominio Vercel)
   - `JWT_SECRET` e `JWT_REFRESH_SECRET` (stringhe lunghe casuali; il blueprint può generarne due)
   - SMTP: se non invii email, metti placeholder coerenti o configura Gmail/App Password
5. Deploy. Copia l’URL pubblico del servizio, es. `https://barberos-api.onrender.com`.

## 5. Frontend (Vercel)

1. **Settings → Environment Variables**:
   - `API_ORIGIN` = URL Render **senza** slash finale (es. `https://barberos-api.onrender.com`).
2. **Redeploy** il progetto.
3. Root del repo su Vercel: intero monorepo (dove ci sono `vercel.json` e `middleware.js`), oppure solo `frontend` se in quel caso hai anche `frontend/middleware.js`.

## 6. Verifica

- `https://TUO-RENDER/health` → JSON `ok`
- Dal sito Vercel: login / registrazione

## Note

- Piano free Render: dopo inattività il servizio va in sleep; la prima richiesta può tardare.
- `npm run migrate` va eseguito **una sola volta** per database vuoto (ripetere fallisce se gli oggetti esistono già).
