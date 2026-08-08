# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation is a Mutual NDA prototype, drafted via an AI chat interface, on a Docker/FastAPI/SQLite foundation (see Implementation Status below); the other 10 document types and user authentication/persistence are planned but not yet built.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
Consider statically building the frontend and serving it via FastAPI, if that will work.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation Status

### Completed (PL-3)
- Mutual NDA form prototype (Next.js) with live preview and PDF download
- No backend, no persistence - client-only, single document type

### Completed (PL-4)
- Docker multi-stage build (Node 22 builds the Next.js static export; Python 3.12 + `uv` runs the backend and serves it), image/container name `prelegal`
- FastAPI backend (`backend/`, a `uv` project) with SQLite (`backend/data/app.db`) deleted and recreated fresh on every startup (via a `lifespan` hook)
- `users` table schema only (`id`, `email` unique, `password_hash`, `created_at`) - no signup/signin routes yet, scaffolding for a future ticket
- Next.js static export (`output: "export"`) mounted by FastAPI at `/` (registered after API routes so `/api/*` always wins); mount is skipped gracefully if the static build isn't present, so the backend can also run standalone in local dev
- Start/stop scripts for Mac, Linux, Windows (`scripts/`), using plain `docker build`/`docker run` with `--env-file .env` when that file exists; both start and stop are idempotent (safe to re-run without pairing every start with a stop first)
- No product features changed - still the same PL-3 Mutual NDA form

### Completed (PL-5)
- The Mutual NDA form was replaced with a freeform AI chat: `ChatPanel` (frontend) sends the full
  message history plus the current field snapshot to `POST /api/chat` on every turn; the backend
  calls the LLM (via the Cerebras skill's LiteLLM/OpenRouter pattern) with Structured Outputs to
  return a reply plus the full updated field snapshot, which the frontend adopts wholesale - no
  session/DB state, the frontend is the source of truth for the current snapshot
- The live preview (`NdaPreview`) is now directly editable inline (click any value to correct it),
  so users aren't limited to correcting the AI's extraction through more chat messages
- Backend gained a `routers/` + `services/` + `models/` structure (`app/routers/chat.py`,
  `app/services/nda_chat.py`, `app/models/{nda,chat}.py`) to keep room for the other 10 document
  types; Pydantic models use `alias_generator=to_camel` so the wire format matches the frontend's
  `NdaFormData` shape byte-for-byte while Python stays snake_case
- Local dev running `next dev` (port 3000) against a standalone backend (port 8000) needs
  `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` in `frontend/.env.local`; the Docker/production
  path is same-origin and needs nothing (CORS is scoped to `localhost:3000` only)
- No product/document-type scope change beyond the interaction model - still just the Mutual NDA

### Not yet started (PL-6, PL-7)
Multi-document-type support and full user authentication/persistence described in earlier drafts
of this file have **not** been built yet. They remain planned follow-on work, not completed
features.

### Current API Endpoints
- `GET /api/health` - Health check (all other routes serve the static frontend)
- `POST /api/chat` - One turn of the Mutual NDA chat; body `{ messages, ndaData }`, returns
  `{ reply, ndaData }` (the full updated field snapshot)