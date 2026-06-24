# LAIO

LAIO is a personalized English-learning platform built as a modular monolith with
Next.js, FastAPI, PostgreSQL, and Supabase Auth.

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
   uvicorn app.main:app --reload
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
`http://127.0.0.1:8000`.

## Quality checks

```powershell
cd backend
pytest
alembic check

cd ..\frontend
npm run typecheck
npm run build
```

See `PRODUCT.md`, `ARCHITECTURE.md`, and `API_CONTRACT.md` before starting a
new milestone.

## Existing database migration

The migration chain includes the schema that existed before Alembic. For an
existing LAIO database, back it up, then mark the legacy schema before applying
the learning-session migration:

```powershell
cd backend
alembic stamp 0001
alembic upgrade head
```

For a new empty database, run only `alembic upgrade head`.
