# verbo-backend

Thin Hono proxy that holds the OpenAI key. The Verbo client posts to `/api/<function>`; this server forwards to the OpenAI API and returns the same shape the client previously got from calling the SDK directly.

## Local dev

```bash
cd server
npm install
cp .env.example .env.local         # then fill in your OpenAI API key
npm run dev
```

Server listens on `:8787`. From the repo root, `npm run server` is a shortcut for the same.

In a second terminal, run the client: `npm run dev` from the repo root. Vite reads `VITE_PROXY_URL=http://localhost:8787` from the root `.env.local`.

### Env (`server/.env.local`, gitignored)

```
OPENAI_API_KEY=sk-...
ALLOWED_ORIGINS=http://localhost:3000
```

`ALLOWED_ORIGINS` is a comma-separated list (spaces around commas are trimmed). Requests whose `Origin` header isn't in the list get 403. `/health` is exempt (Fly health checks need it).

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

## Security

Read this before deploying a public instance:

- **There is no authentication between the client and this proxy.** The origin
  allowlist (`ALLOWED_ORIGINS`) only stops browsers from *other websites* —
  any non-browser client (curl, a script) can forge the `Origin` header.
  Anyone who discovers your deployed URL can spend your OpenAI credits.
- **Rate limiting bounds the damage but doesn't eliminate it.** `/api/*` routes
  are limited to 30 requests/minute per client IP (in-memory sliding window,
  429 + `Retry-After` when exceeded; see `src/middleware/rate-limit.ts`).
  The limit resets on restart and isn't shared across instances.
- **Before any serious public deployment, add real auth** — e.g. a shared
  secret header checked by middleware, signed requests, or a session token
  issued by your own backend. As shipped, this server is designed for a
  hobby deployment where the URL is only embedded in your own client.
- Set a **spending limit on your OpenAI account** as a backstop.

## Deploying to Fly.io

Authenticate the `fly` CLI (`fly auth login`), then from this directory:

```bash
fly launch --no-deploy --copy-config         # first time only; pick your own app name
fly secrets set OPENAI_API_KEY=sk-...        # your production key
fly secrets set ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
fly deploy
```

Replace the `ALLOWED_ORIGINS` values with the origin(s) your client is actually
served from, and update `app` in `fly.toml` to the name you picked. After
deploy, set `VITE_PROXY_URL=https://<your-app>.fly.dev` in the client's
production env.

## Build

`npm run build` compiles to `dist/`. `npm start` runs the compiled output. The `Dockerfile` does both in a multi-stage build so the runtime image carries only production deps.
