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

1. **Settings → Environment Variables** (ambiente **Production**):
   - Nome esatto: **`API_ORIGIN`**
   - Valore: URL Render **senza** slash finale (es. `https://barberos-api.onrender.com`).
   - Il proxy è una **serverless Node** (`api/[[...slug]].js`): legge `API_ORIGIN` a runtime (anche se marcata Sensitive). Il vecchio **Edge Middleware** non vedeva le variabili Sensitive ed è stato rimosso.
2. **Deployments → Redeploy** (dopo ogni modifica alle variabili).
3. **Root Directory** su Vercel:
   - **vuota** (repo root): usi `vercel.json` + `api/[[...slug]].js` alla root.
   - oppure **`frontend`**: deve esistere anche `frontend/api/[[...slug]].js` (già nel repo).

**Alternativa senza proxy:** imposta **`VITE_API_BASE_URL`** = `https://tuo-api.onrender.com/api` (con `/api` finale), abilitala per il **build**, ridistribuisci. Il browser chiama direttamente Render; su Render `FRONTEND_URL` deve essere il dominio Vercel (CORS).

## 6. Verifica

- `https://TUO-RENDER/health` → JSON `ok`
- Dal sito Vercel: login / registrazione

## Note

- Piano free Render: dopo inattività il servizio va in sleep; la prima richiesta può tardare.
- `npm run migrate` va eseguito **una sola volta** per database vuoto (ripetere fallisce se gli oggetti esistono già).
