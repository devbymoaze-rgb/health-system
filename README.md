# CRM Eye (HealthBot)

AI-powered ophthalmology CRM with a Next.js admin dashboard and a WhatsApp worker bot.

## Monorepo Structure

```
crm-eye/
├── apps/
│   ├── web/          # Next.js CRM dashboard + API routes
│   └── worker/       # WhatsApp Baileys worker + AI auto-replies
├── packages/
│   ├── database/     # MongoDB models + connection
│   ├── shared/       # Appointments, dates, Google Calendar, follow-ups
│   └── ai/           # OpenAI tools, prompts, session memory
├── package.json      # npm workspaces root
└── railway.json      # Railway deployment config
```

## Prerequisites

- Node.js 20+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- OpenAI API key
- Google Cloud OAuth credentials (optional, for Calendar sync)

## Environment Variables

Create `.env.local` at the **repository root**:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/moazbackend
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_JAVASCRIPT_ORIGIN=http://localhost:3000
```

Optional path overrides (used when web and worker run from different directories):

```env
WEB_PUBLIC_DIR=./apps/web/public
WORKER_AUTH_DIR=./apps/worker/auth
```

## Local Development

```bash
# Install all workspace dependencies
npm install

# Run web + worker together
npm run dev

# Or run individually
npm run dev:web
npm run dev:worker
```

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| Login | `admin@example.com` / `password` |
| WhatsApp QR | http://localhost:3000/whatsapp |

## Production Scripts

```bash
npm run build        # Build Next.js web app
npm run start:web    # Start web server
npm run start:worker # Start WhatsApp worker
```

## Railway Deployment

Deploy **two independent services** from the same repository. **Root Directory must be empty** (repo root) — do not set it to `apps/web`.

### Service 1: Web (`@crm-eye/web`)

Uses `railway.json` and `nixpacks.toml` automatically.

| Setting | Value |
|---------|-------|
| Root Directory | *(empty — repo root)* |
| Build Command | `npm run build` *(install runs `npm ci` automatically)* |
| Start Command | `npm run start:web` |
| Nixpacks Config | `nixpacks.toml` |

Required environment variables:

```env
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-app.up.railway.app/api/auth/google/callback
GOOGLE_JAVASCRIPT_ORIGIN=https://your-app.up.railway.app
```

### Service 2: Worker (`@crm-eye/worker`)

Copy settings from `railway.worker.json` and `nixpacks.worker.toml`.

| Setting | Value |
|---------|-------|
| Root Directory | *(empty — repo root)* |
| Build Command | *(leave empty — install runs `npm ci` automatically)* |
| Start Command | `npm run start:worker` |
| Nixpacks Config | `nixpacks.worker.toml` |

Use the **same** `MONGODB_URI`, `OPENAI_API_KEY`, and Google credentials as the web service.

Set path variables on the worker if you want local filesystem backups for QR files:

```env
WEB_PUBLIC_DIR=/app/apps/web/public
WORKER_AUTH_DIR=/app/apps/worker/auth
```

> QR codes and reset signals are stored in MongoDB so the web and worker services can communicate across separate Railway containers.

## Architecture

- **Web** — Next.js 15 dashboard, cookie auth, REST API routes
- **Worker** — Standalone Node process using Baileys for WhatsApp, OpenAI for auto-replies
- **Database** — Shared Mongoose models used by both services
- **IPC** — MongoDB fields on `Settings` (`whatsappQr`, `whatsappResetRequestedAt`) for web ↔ worker communication

## Packages

| Package | Purpose |
|---------|---------|
| `@crm-eye/database` | Mongoose models, web + worker DB connection |
| `@crm-eye/shared` | Appointment logic, PKT dates, Google Calendar sync |
| `@crm-eye/ai` | OpenAI tool-calling, system prompts, chat sessions |
