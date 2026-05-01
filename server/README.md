# verbo-backend

Thin Hono proxy that holds the OpenAI key. The Verbo client posts to `/api/<function>`; this server forwards to the OpenAI API and returns the same shape the client previously got from calling the SDK directly.

## Local dev

```bash
cd server
npm install
cp .env.local.example .env.local   # if the example exists; otherwise see "Env" below
npm run dev
```

Server listens on `:8787`. From the repo root, `npm run server` is a shortcut for the same.

In a second terminal, run the client: `npm run dev` from the repo root. Vite reads `VITE_PROXY_URL=http://localhost:8787` from the root `.env.local`.

### Env (`server/.env.local`, gitignored)

```
OPENAI_API_KEY=sk-...
ALLOWED_ORIGINS=http://localhost:3000
```

`ALLOWED_ORIGINS` is a comma-separated list. Requests whose `Origin` header isn't in the list get 403. `/health` is exempt (Fly health checks need it).

## Endpoints

| Method · Path | Purpose |
|---|---|
| GET `/health` | liveness check |
| POST `/api/verify` | fact-check a posted argument (reasoning model + web_search) |
| POST `/api/suggest-sources` | suggest sources supporting a stance |
| POST `/api/consensus` | summarize top verified arguments |
| POST `/api/tags` | suggest tags for a debate topic |
| POST `/api/enhance` | rewrite an argument for clarity |
| POST `/api/research` | generate FOR/NEUTRAL/AGAINST research library |
| POST `/api/research-synthesis` | synthesize agree/disagree/underexplored takeaways |
| POST `/api/transcribe` | transcribe audio (Whisper) |
| POST `/api/debate-search` | semantic match a query against debate topics |

All POST endpoints accept JSON. Internal errors return HTTP 200 + the same fallback shape the client previously used (graceful degradation), except `/api/transcribe` which returns 4xx + `{ error }` so the voice-input UI can surface failures.

## Launch-day deploy

`fly` CLI auth is already set up. From this directory:

```bash
fly launch --no-deploy --copy-config         # only if first time; otherwise skip
fly secrets set OPENAI_API_KEY=sk-...        # paste the production key
fly secrets set ALLOWED_ORIGINS=https://verbo.app,https://www.verbo.app
fly deploy
```

After deploy, set `VITE_PROXY_URL=https://verbo-backend.fly.dev` in the client's production env.

## Build

`npm run build` compiles to `dist/`. `npm start` runs the compiled output. The `Dockerfile` does both in a multi-stage build so the runtime image carries only production deps.
