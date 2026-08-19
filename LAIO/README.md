# LAIO

LAIO is a persistent learning memory and decision system for Vietnamese
secondary/high-school students' English learning, built as a modular monolith
with Next.js, FastAPI, PostgreSQL, and Supabase Auth. The proven first loop is
vocabulary capture → spaced-repetition review → measurable progress; the long-term
strategy is in `STRATEGY.md`.

## Local development

### Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Create a virtual environment and install dependencies:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   alembic upgrade head
   uvicorn app.main:app --reload --port 8001
   ```

### Frontend

1. Copy `frontend/.env.example` to `frontend/.env.local`.
2. Install dependencies and run Next.js:

   ```powershell
   cd frontend
   npm ci
   npm run dev
   ```

The frontend runs at `http://localhost:3000`; the API runs at
`http://127.0.0.1:8001`. The frontend calls the API through the `/api/backend`
proxy route, which forwards to `BACKEND_INTERNAL_URL` (see
`frontend/.env.example`) — keep that value in sync with the port above.

## Runtime integrations

### Vbee TTS

Vbee credentials belong in `backend/.env`, never in `frontend/.env.local`:

```env
VBEE_APP_ID=your-vbee-app-id
VBEE_TOKEN=your-vbee-token
VBEE_VOICE_CODE=en-US-Standard-F
```

The backend calls Vbee Realtime TTS when a user presses the audio button and
returns the MP3 stream without exposing the Vbee token. Restart the FastAPI server
after changing `backend/.env`.

## Quality checks

- Backend: `pytest`, `alembic check`, and `pip_audit` (or equivalent CI checks)
- Frontend: `npm run typecheck` and `npm run build`; `npm audit` in CI
- See `TESTING.md` for command mapping, scope, and what each check does.

## Source-of-truth and roadmap entry points

- Product slice selection: `BACKLOG.md`
- Feature specs: `docs/specs/README.md` and active spec files under
  `docs/specs/`
- API contract: `API_CONTRACT.md`
- Implementation details and conflict protocol: `ARCHITECTURE.md`, `AI_HANDOFF.md`
- Technical debt and blocker log: `TECH_DEBT.md`

For deployment/database operations, follow `README`-level commands only when
authority and evidence support them. In this checkout, tracked migrations currently
end at `0004`; no owner-approved canonical external `schema.sql` is present in
this repo.

## Existing database migration

The tracked migration head is `0004`.

### Alembic-managed local database

```powershell
cd backend
alembic upgrade head
```

### Existing Supabase/live schema migration support (owner-approved only)

For a database created directly from the external canonical schema-v2 process, use
an approved deployment plan from the owning team:

1. Back up
2. Verify schema compatibility
3. Apply the approved stamped/upgrade sequence

This repository does not include the authoritative canonical SQL file and should not
be used as one.
