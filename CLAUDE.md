# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation supports all 11 document types in catalog.json, drafted via an AI chat interface that infers the document type from the conversation, on a Docker/FastAPI/SQLite foundation (see Implementation Status below); user authentication/persistence is planned but not yet built.

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
- Superseded by PL-6: `app/models/nda.py`, `app/services/nda_chat.py`, `frontend/lib/nda-data.ts`,
  `nda-template.ts`, `nda-pdf.tsx`, and `NdaPreview.tsx` no longer exist - the Mutual NDA is now
  one of 11 document types handled by the generic pipeline described below

### Completed (PL-6)
- Expanded from the Mutual NDA only to all 11 document types in catalog.json. Document-type
  selection is chat-driven, not a picker: the user describes what they want in freeform chat, and
  the backend classifies it against the catalog (or explains what's unsupported and suggests the
  closest match) before extracting that type's fields - see `backend/app/services/chat_service.py`
- Each document type is a small Python module under `backend/app/document_types/` (`FieldSpec`s +
  a `party_roles` tuple + a `clause_mapping` table); `backend/app/document_types/registry.py` is
  the single source of truth, validated at test time against `catalog.json` for 1:1 parity
- Clause text is **derived from the real `templates/*.md` files**, not hand-transcribed: a
  hand-authored `clause_mapping` per document type (span label -> field key, or `"literal"` for
  party-role mentions like "Customer"/"Provider" that aren't real fields) drives
  `backend/app/document_types/clause_builder.py`, which parses each template's numbered clauses
  and substitutes `{{field_key}}` tokens. `backend/scripts/generate_clause_data.py` regenerates the
  checked-in `backend/app/document_types/generated/<slug>.json` files - re-run it after editing
  any `clause_mapping`, and review the diff (this is the legal-review checkpoint for clause text).
  `backend/tests/test_document_registry.py` fails CI if the checked-in JSON goes stale, or if any
  template's span label isn't classified in its document type's `clause_mapping`
- Every document type's fields are modeled **flat** (scalars, dates, and `{type, years}` "term"
  fields) - naturally repeatable/nested structures in the real templates (CSA's multiple Order
  Forms, PSA's multiple Statements of Work, DPA's subprocessor list) are flattened into a single
  free-text summary field rather than modeled as real repeatable child records. Addenda with no
  parties of their own (SLA, DPA, AI Addendum) get a `host_agreement_reference` free-text field
  instead of a real link to another generated document, since there's no persistence/document
  linking yet
- New endpoints `GET /api/documents` (catalog) and `GET /api/documents/{slug}` (one type's field
  schema + derived clauses) make the backend the single source of truth; the frontend has no
  hardcoded per-document TypeScript type anymore - `frontend/components/DocumentPreview.tsx` and
  `frontend/lib/document-pdf.tsx` render whatever schema comes back, and
  `frontend/lib/merge-field-data.ts` merges any document type's field shape generically (a
  structural walk, not named fields) - this is what let PL-5's single-document merge logic scale
  to 11 types with zero per-type code
- Field data on the wire (`ChatRequest.fieldData` / `ChatTurnResult.fieldData`) is a plain
  snake_case-keyed `dict`, matching `FieldSpec.key` and the `{{token}}` placeholders in generated
  clause text exactly - deliberately *not* camelCased like PL-5's `NdaFormData`, so no
  case-conversion is needed anywhere between a field's schema key, its clause token, and its wire
  value. Only the outer envelope (`reply`, `documentType`, `fieldData` themselves) stays camelCase
- Two UX fixes: (a) the chat's message box now regains focus after every turn (success or retry)
  via a ref + `useEffect`, and the textarea uses `readOnly` instead of `disabled` while a request
  is in flight so it never loses focus in the first place; (b) the assistant is now guaranteed to
  ask a follow-up question whenever required fields are still missing, via **both** stronger
  prompt wording and a deterministic backend fallback (`backend/app/services/followup.py` checks
  which required fields are empty and appends a question if the model's reply doesn't already end
  in one) - this can't fail silently the way prompt-only guidance could
- The Dockerfile now copies `templates/` and `catalog.json` into the image (`backend/app/config.py`
  resolves their path in both local dev and the flattened Docker `/app` layout) - previously
  neither was copied in, so `/api/documents*` would have 500'd in production

### Not yet started (PL-7)
Full user authentication/persistence described in earlier drafts of this file has **not** been
built yet. It remains planned follow-on work, not a completed feature.

### Current API Endpoints
- `GET /api/health` - Health check (all other routes serve the static frontend)
- `GET /api/documents` - Catalog of all 11 document types (`slug`, `name`, `description`)
- `GET /api/documents/{slug}` - One document type's field schema, party roles, and derived clauses
- `POST /api/chat` - One turn of the chat; body `{ messages, documentType, fieldData }` (`documentType`
  may be `null` before a type is resolved), returns `{ reply, documentType, fieldData }`