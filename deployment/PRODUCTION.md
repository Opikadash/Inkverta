# Production deployment

This repo ships 3 targets:

- **Website**: `frontend/` (Vite build to `frontend/dist`)
- **Backend API**: `backend/` (Express on port `3001`)
- **Browser extension**: `chrome-extension/` (Webpack build to `chrome-extension/dist`)

For an **app** experience on desktop/mobile, the website is packaged as a **PWA** (installable from the browser) via `frontend/public/manifest.webmanifest`.

## Environment variables

Backend (create `backend/.env` from `backend/.env.example`):

- `GOOGLE_TRANSLATE_API_KEY` (required for Google Translate)
- `DEEPL_API_KEY` (optional)
- `FRONTEND_URL` / `CORS_ORIGINS` (set to your deployed web app origin(s))

Frontend:

- `VITE_API_URL` can be injected at **runtime** in Docker via `frontend/docker/env-config.sh` (served at `/env-config.js`).

For Vercel builds, set `VITE_API_URL=https://Inkverta-api.up.railway.app` (see `frontend/.env.example`).

## Local production (Docker, recommended)

1. From repo root, set keys in `.env` (or export env vars):
   - `GOOGLE_TRANSLATE_API_KEY=...`
   - `DEEPL_API_KEY=...` (optional)
2. Run:
   - `docker compose -f docker/docker-compose.yml up --build -d`
3. Open:
   - Website: `http://localhost/`
   - API health: `http://localhost/api/health`

## Cloud production (Traefik + ACME)

`deployment/docker-compose.prod.yml` contains a Traefik setup. You must update:

- `traefik.http.routers.backend.rule` host (API domain)
- `traefik.http.routers.frontend.rule` host (web domain)
- `certificatesresolvers.myresolver.acme.email`

Then run:

- `docker compose -f deployment/docker-compose.prod.yml up --build -d`

## Browser extension

Build:

- `npm run extension:build`

Load unpacked:

- Chrome → `chrome://extensions` → Developer mode → Load unpacked → select `chrome-extension/dist`

Configure:

- In the extension popup → **Settings** → set **Backend API URL** (e.g. `https://api.yourdomain.com`).
