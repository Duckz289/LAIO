# LAIO

LAIO is a persistent learning memory and decision system for Vietnamese
secondary/high-school students' English learning, built as a modular monolith
with Next.js, FastAPI, PostgreSQL, and Supabase Auth. The proven first loop is
vocabulary capture → spaced-repetition review → measurable progress; the
long-term direction is in `STRATEGY.md`.

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
`http://127.0.0.1:8001`. The frontend calls the API through the
`/api/backend` proxy route, which forwards to `BACKEND_INTERNAL_URL`
(see `frontend/.env.example`) — keep that value in sync with the port
above.

### Vbee TTS

Vbee credentials belong in `backend/.env`, never in `frontend/.env.local`:

```env
VBEE_APP_ID=your-vbee-app-id
VBEE_TOKEN=your-vbee-token
VBEE_VOICE_CODE=en-US-Standard-F
```

The backend calls Vbee Realtime TTS when a user presses the audio button and
returns the MP3 stream without exposing the Vbee token. Restart the FastAPI
server after changing `backend/.env`.

## Quality checks

Install `pip-audit==2.10.1` in the backend development environment before the
security check (CI installs it separately from runtime dependencies).

```powershell
cd backend
pytest
alembic check
python -m pip_audit -r requirements.txt

cd ..\frontend
npm run typecheck
npm run build
npm audit
```

See `PRODUCT.md`, `STRATEGY.md`, `ARCHITECTURE.md`, and `API_CONTRACT.md`
before starting a new milestone.

## Existing database migration

The migration head is `0004`. For a database created and managed entirely by
Alembic, back it up and run:

```powershell
cd backend
alembic upgrade head
```

For a Supabase database created directly from the canonical schema-v2 SQL,
do not replay `0001`–`0003`. Back it up, verify the schema matches v2, stamp
`0003`, then apply `0004`. This is an owner-approved deployment operation:

```powershell
alembic stamp 0003
alembic upgrade 0004
```

`START_LOCAL.cmd` validates required configuration and refuses to start when
port 8001 belongs to another application, preventing the frontend from silently
proxying credentials to the wrong local service.
