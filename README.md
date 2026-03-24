# ✂️ BarberOS — Sistema Gestione Appuntamenti Barberia

Stack completo: **Node.js + Express · PostgreSQL + Redis · React + Vite + Tailwind CSS · React Native**

---

## Come lanciare il progetto

In sviluppo servono **due terminali** (backend e frontend) e i servizi **PostgreSQL** e **Redis** in esecuzione sulla macchina (o in Docker).

### Prerequisiti

- **Node.js 18 o superiore** (consigliato 20 LTS). Controlla con `node -v`; versioni precedenti alla 18 non sono compatibili con lo stack Vite attuale.
- **npm** (di solito incluso con Node).
- **PostgreSQL** con un database creato e schema caricato (vedi sotto).
- **Redis** in ascolto (es. `localhost:6379`).

### PostgreSQL e Redis con Docker (consigliato se non li hai installati)

Dalla **root del repo** (serve [Docker Desktop](https://www.docker.com/products/docker-desktop/) o Docker Engine):

```bash
docker compose up -d
```

Poi carica schema e seed sul database del container (con `psql` locale o da un container):

```bash
# se hai psql sul Mac, con porta 5432 libera:
psql "postgresql://postgres:postgres@localhost:5432/barberos" -f database/001_schema.sql
psql "postgresql://postgres:postgres@localhost:5432/barberos" -f database/002_seed.sql
```

In `backend/.env` usa gli stessi valori di `backend/.env.example` (`DATABASE_URL`, `REDIS_URL`). Per fermare i container: `docker compose down`.

### Errore `ECONNREFUSED` su porta 5432 o 6379

Significa che **PostgreSQL** o **Redis** non sono avviati. Avviali (Homebrew `brew services start …`, oppure `docker compose up -d` come sopra), poi rilancia `npm run dev` nel backend.

### Configurazione iniziale (una tantum)

Esegui nell’ordine: database → Redis → dipendenze e `.env` del backend → dipendenze del frontend. I dettagli sono nelle sezioni [Database PostgreSQL](#1-database-postgresql), [Redis](#2-redis), [Backend](#3-backend) e [Frontend Web](#4-frontend-web).

### Avvio in sviluppo (ogni sessione)

1. Avvia **PostgreSQL** e **Redis** (se non sono già servizi di sistema sempre attivi).
2. **API** — da `backend/`:
   ```bash
   cd backend
   npm run dev
   ```
   L’API è su **http://localhost:3000**. Verifica rapida: **http://localhost:3000/health**
3. **Interfaccia web** — da `frontend/` (in un altro terminale):
   ```bash
   cd frontend
   npm run dev
   ```
   L’app è su **http://localhost:5173**. In sviluppo, Vite inoltra le richieste a `/api` verso `http://localhost:3000` (vedi `vite.config.js`).

### Build di produzione (solo frontend)

```bash
cd frontend
npm install
npm run build
npm run preview   # anteprima locale della cartella dist/
```

Il backend va avviato come servizio Node (`npm start` in `backend/` dopo `NODE_ENV=production` e variabili coerenti con l’ambiente).

---

## 📁 Struttura Progetto

```
barberos/
├── backend/           # API Node.js + Express
├── frontend/          # Web App React + Vite
├── database/          # Schema SQL + Seed
├── docker-compose.yml # Postgres + Redis in locale (opzionale)
└── README.md
```

---

## 🚀 Setup Rapido (dettaglio)

### 1. Database PostgreSQL

```bash
# Crea il database
createdb barberos

# Esegui lo schema
psql -d barberos -f database/001_schema.sql

# Carica i dati di test
psql -d barberos -f database/002_seed.sql
```

### 2. Redis

```bash
# macOS
brew install redis && brew services start redis

# Ubuntu/Debian
sudo apt install redis-server && sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env
# Modifica .env: credenziali DB, JWT_SECRET, JWT_REFRESH_SECRET, Redis, email, FRONTEND_URL

npm run dev
# API su http://localhost:3000 — health check: GET http://localhost:3000/health
```

Usa `npm start` per avvio senza nodemon (adatto a produzione o script di sistema).

### 4. Frontend Web

```bash
cd frontend
npm install
npm run dev
# App su http://localhost:5173 (proxy /api → localhost:3000)
```

---

## 🔑 Credenziali Demo

| Ruolo    | Email                  | Password     |
|----------|------------------------|--------------|
| Admin    | admin@barberos.it      | Password123! |
| Barbiere | marco@barberos.it      | Password123! |
| Cliente  | giovanni@test.it       | Password123! |

---

## 🌐 API Endpoints Principali

```
POST   /api/auth/register          Registrazione
POST   /api/auth/login             Login
POST   /api/auth/refresh           Rinnova token
GET    /api/auth/me                Utente corrente

GET    /api/slots?barber_id=&date=&service_id=   Slot disponibili
GET    /api/services               Lista servizi
GET    /api/barbers                Lista barbieri

GET    /api/appointments           I miei appuntamenti
POST   /api/appointments           Crea appuntamento
PATCH  /api/appointments/:id       Modifica appuntamento
DELETE /api/appointments/:id       Cancella appuntamento

GET    /api/admin/stats            Statistiche [ADMIN]
GET    /api/admin/appointments     Tutte le prenotazioni [ADMIN]
POST   /api/admin/barbers          Crea barbiere [ADMIN]
POST   /api/admin/services         Crea servizio [ADMIN]
```

---

## 🔒 Variabili d'Ambiente Backend (.env)

Copia `backend/.env.example` in `backend/.env` e adatta i valori. Riferimento:

```env
NODE_ENV=development
PORT=3000

# Database (allinea DB_* e DATABASE_URL allo stesso database)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=barberos
DB_USER=postgres
DB_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/barberos

# Auth — usa segreti lunghi e casuali in produzione
JWT_SECRET=change-me-to-a-very-long-random-secret-256-bits
JWT_REFRESH_SECRET=another-very-long-random-secret-for-refresh
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Redis
REDIS_URL=redis://localhost:6379

# Email (es. Gmail con App Password o altro SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tuamail@gmail.com
SMTP_PASS=tua-app-password
FROM_EMAIL=noreply@barberos.it
FROM_NAME=BarberOS

# CORS / app
FRONTEND_URL=http://localhost:5173
BCRYPT_ROUNDS=12
```

---

## 🗄️ Schema Database — Tabelle Principali

| Tabella        | Descrizione                              |
|----------------|------------------------------------------|
| users          | Tutti gli utenti (CLIENT/BARBER/ADMIN)   |
| barbers        | Profilo esteso barbieri (1:1 con users)  |
| services       | Catalogo servizi con prezzo e durata     |
| availability   | Orari settimanali per ogni barbiere      |
| blocked_slots  | Slot bloccati manualmente (ferie, ecc.)  |
| appointments   | Prenotazioni con anti-overlap garantito  |
| audit_logs     | Log di tutte le azioni critiche          |

---

## 📱 Mobile App (React Native)

```bash
# Installa Expo CLI
npm install -g expo-cli

# Crea la mobile app
npx create-expo-app barberos-mobile --template blank-typescript
cd barberos-mobile

# Installa dipendenze chiave
npm install @react-navigation/native @react-navigation/stack
npm install axios zustand react-native-calendars
expo install expo-notifications

# Configura la baseURL nell'API client:
# const BASE_URL = 'http://TUO-IP-LOCALE:3000/api';
# Stesse API del frontend, stesso store Zustand
```

Schermate principali da creare:
- `HomeScreen` → lista servizi + CTA Prenota
- `BarberSelectScreen` → grid barbieri
- `DateSelectScreen` → calendario react-native-calendars
- `SlotSelectScreen` → grid orari disponibili
- `ConfirmScreen` → riepilogo + conferma
- `MyAppointmentsScreen` → lista appuntamenti cliente
- `BarberCalendarScreen` → calendario settimana barbiere

---

## 🚀 Deploy Produzione

### Backend — alternative a Railway

Se non vuoi usare **Railway**, puoi ospitare l’API su altri servizi (verifica sempre **piani e limiti attuali** sul sito del provider).

| Servizio | Note |
|----------|------|
| **[Render](https://render.com)** | Web Service Node (root `backend`, comando `npm start` o `node src/app.js`), PostgreSQL e Redis come servizi gestiti dal dashboard. Free tier con limiti (es. servizi che vanno in sleep). |
| **[Fly.io](https://fly.io)** | App container con `fly launch`; Postgres e Redis come add-on Fly o Redis esterno (es. [Upstash](https://upstash.com/) con tier gratuito). |
| **[Koyeb](https://www.koyeb.com)** | Deploy da Git/Docker; spesso usato insieme a DB Redis/Postgres esterni. |
| **VPS economico** (Hetzner, DigitalOcean, Oracle Cloud Free Tier, ecc.) | Node + PM2/systemd, PostgreSQL e Redis installati a mano o con Docker. Massimo controllo, più manutenzione. |

Comune a tutti: imposta le **stesse variabili** del file `backend/.env` (in particolare `DATABASE_URL`, `REDIS_URL`, `JWT_*`, `FRONTEND_URL`, SMTP).

#### Opzione Railway (se la usi)

Dalla cartella del progetto collegata a Railway, con la [CLI attuale](https://docs.railway.com/cli/add):

```bash
npm install -g @railway/cli
railway login
railway init
railway add --database postgres --database redis
railway up
```

(`railway add` accetta `postgres` e `redis`, non `postgresql`. Avvia il deploy dalla directory già collegata al servizio Node, di solito `backend/`, oppure imposta root e comando start nel pannello.)

### Frontend → Vercel (o analoghi)

**Da CLI** (consigliato: root = `frontend`):

```bash
npm install -g vercel
cd frontend
vercel --prod
```

**Da GitHub su Vercel:** nel progetto, apri **Settings → General → Root Directory** e imposta **`frontend`**. Build: `npm run build`, output: **`dist`**. Il file `frontend/vercel.json` aggiunge i **rewrite** necessari a React Router (altrimenti rotte come `/login` danno **404 NOT_FOUND** da Vercel).

Se importi il repo intero **senza** impostare la root su `frontend`, in root c’è `vercel.json` che punta build/output su `frontend/` (commit e ridistribuisci).

**Dopo il deploy:** in locale le API passano dal proxy Vite su `/api`; su Vercel il sito è solo statico: devi esporre il backend su un URL pubblico e (in un passo successivo) puntare il frontend a quell’URL (es. variabile `VITE_API_BASE_URL` + aggiornamento di `api/client.js`), oppure configurare **rewrites** Vercel verso l’host dell’API.

Alternative al frontend statico: [Netlify](https://www.netlify.com/), [Cloudflare Pages](https://pages.cloudflare.com/), [GitHub Pages](https://pages.github.com/) (con build `npm run build` e cartella `dist/`).

### Variabili da impostare sul backend

- Copia i valori da `backend/.env` nelle variabili d’ambiente del provider.
- **`FRONTEND_URL`** deve essere l’URL pubblico del sito (es. dominio Vercel/Netlify) per **CORS** e link nelle email.

---

## 🛡️ Sicurezza — Checklist

- [x] JWT Access Token (15 min) + Refresh Token (30 giorni)
- [x] Bcrypt password hashing (12 rounds)
- [x] Rate limiting (100 req/15min globale, 10/ora su login)
- [x] Helmet.js headers di sicurezza
- [x] CORS configurato su whitelist
- [x] Validazione input con Joi su ogni endpoint
- [x] RBAC: ogni route protetta per ruolo
- [x] Data isolation: ogni query filtra per user dal token
- [x] Anti-double-booking con `FOR UPDATE SKIP LOCKED`
- [x] Unique index su DB per prevenire overlap a livello database

---

## 📦 Dipendenze Backend

```json
express, sequelize, pg        → Server + ORM + Database
jsonwebtoken, bcryptjs         → Auth
ioredis, bull                  → Cache + Code
nodemailer                     → Email
joi                            → Validazione
helmet, cors, express-rate-limit → Sicurezza
winston, morgan                → Logging
```

---

*BarberOS — Costruito con ❤️ e Node.js*
