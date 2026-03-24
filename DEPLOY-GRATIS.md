# Deploy gratuito (Vercel + Render + Neon + Upstash)

Non possiamo accedere al tuo account Render/Neon: i passi li fai tu nel browser.

## 0. Database senza copiare URL (Blueprint Render) — “lo fa Render”

Il file **`render.yaml`** in repo definisce:

- **Postgres free** (`barberos-db`)
- **Web Service** (`barberos-api`) con **`DATABASE_URL` collegata automaticamente** al database (niente localhost).

Passi:

1. [render.com](https://render.com) → **New** → **Blueprint**.
2. Collega il repo **barberOS** e conferma (branch `main`).
3. Render crea DB + API. **Non** impostare `DATABASE_URL` a mano (e cancella valori con `localhost` se restano da un deploy vecchio).
4. Compila nel servizio web solo ciò che manca: **`FRONTEND_URL`**, eventuale **`REDIS_URL`** (Upstash), SMTP.
5. **Schema tabelle:** su Render (piano free) non serve la Shell. All’avvio l’API esegue automaticamente `scripts/apply-schema.js` se è presente la variabile d’ambiente **`RENDER`** (impostata da Render). Lo script è **idempotente** (ripetibile).  
   Per dati demo: dal PC, con `DATABASE_URL` del cloud: `npm run seed`.  
   Disabilitare auto-migrazione: `SKIP_AUTO_MIGRATE=1` su Render.

Se preferisci **Neon** invece del Postgres Render, non usare questo blueprint per il DB oppure sovrascrivi `DATABASE_URL` nel dashboard con la stringa Neon.

## 1. PostgreSQL (Neon, gratis) — solo se non usi il DB del blueprint

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

## 4. API su Render (solo Web Service manuale, senza Blueprint)

Se **non** usi il Blueprint del punto 0:

1. **New** → **Web Service** → repo barberOS, **Root Directory** `backend`.
2. Build `npm run build`, Start `npm start`.
3. Crea un **PostgreSQL** su Render (o Neon) e metti la **`DATABASE_URL`** reale in Environment (mai localhost).
4. `FRONTEND_URL`, `JWT_*`, SMTP, eventuale `REDIS_URL`.
5. Deploy e `npm run migrate` una tantum.

## 5. Frontend (Vercel)

**Consigliato (evita 504 con Render free):** il proxy serverless ha limite **~10 secondi**; il cold start Render spesso è più lungo.

1. **Settings → Environment Variables** — aggiungi per **Production** e **Preview** (devono essere disponibili al **build**):
   - **`VITE_API_BASE_URL`** = `https://tuo-api.onrender.com/api` (URL pubblico Render **con** suffisso `/api`).
2. **Deployments → Redeploy** (ogni volta che cambi variabili `VITE_*`).
3. Su **Render** (backend), **`FRONTEND_URL`** = `https://tuo-progetto.vercel.app` (CORS).

**Opzionale (solo se non usi `VITE_API_BASE_URL`):** **`API_ORIGIN`** = URL Render **senza** `/` finale — attiva il BFF `api/bff.js`; su piano Vercel free può andare in **504** durante il cold start.

**Root Directory** Vercel: vuota (monorepo) oppure `frontend` (c’è `frontend/api/bff.js`).

## 6. Verifica

- `https://TUO-RENDER/health` → JSON `ok`
- Dal sito Vercel: login / registrazione

## Note

- Piano free Render: dopo inattività il servizio va in sleep; la prima richiesta può tardare.
- `npm run migrate` va eseguito **una sola volta** per database vuoto (ripetere fallisce se gli oggetti esistono già).
