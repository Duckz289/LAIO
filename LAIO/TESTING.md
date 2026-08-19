# LAIO testing and verification

This document records the checks that exist in this checkout and what they can
actually demonstrate. A passing typecheck or build is not behavioral proof.

## Verification principle

An implementation task maps its acceptance criteria to the smallest meaningful
combination of:

1. focused automated regression coverage;
2. relevant suite/build checks;
3. manual authenticated verification when user behavior has no automated
   frontend coverage; and
4. recorded evidence in the active feature spec before the backlog task is
   marked `DONE`.

Use the acceptance IDs from `docs/specs/` in test names or comments when doing
so improves traceability.

## Existing automated coverage

### Backend

`backend/pytest.ini` configures pytest against `backend/tests/`. Existing tests
cover, among other concerns:

- pure SM-2 behavior;
- Pydantic validation and learning-session bounds;
- service-level ownership, due-only answering, duplicate-answer prevention,
  session state, SRS updates, and append-only review-history snapshots;
- SQLite-backed integration behavior for due totals, progress summaries, and
  trigger-absent progress fallback;
- API/OpenAPI surface, HTTP hardening, auth/rate-limit behavior, Vbee-service
  failure behavior, and model/schema-alignment assumptions.

The backend tests and Alembic files are corroborating implementation evidence.
They do not replace an owner-approved canonical database schema source.

### Frontend

The frontend currently has no checked-in unit, component, browser, or E2E test
runner. Its available scripts are:

```text
npm run typecheck  # next type generation + TypeScript checking
npm run build      # production Next.js build
npm run lint       # currently aliases type generation + TypeScript checking
```

These checks detect type and build regressions. They do **not** prove that an
authenticated user can complete the vocabulary learning flow.

## Standard commands

Run from the indicated directory using the project’s already-installed
dependencies. Do not install a new test framework merely to satisfy a
specification unless a separately approved task authorizes it.

### Backend

```powershell
cd backend
pytest
alembic check
python -m pip_audit -r requirements.txt
```

CI also validates the migration chain without applying it to a database:

```powershell
cd backend
alembic upgrade head --sql
```

`pip_audit` may need to be installed in the development environment; CI installs
its auditing tooling separately. An unavailable audit executable is a reported
verification gap, not a reason to silently skip it.

### Frontend

```powershell
cd frontend
npm run typecheck
npm run build
npm audit
```

CI uses a clean dependency install (`npm ci`) before its frontend checks. Local
checks should not alter lockfiles or install packages as part of a documentation
pass.

## CI baseline

The checked-in CI workflow runs:

| Area | CI checks |
| --- | --- |
| Backend | dependency install, `pip-audit`, `pytest`, `alembic upgrade head --sql` |
| Frontend | `npm ci`, `npm audit --audit-level=high`, `npm run typecheck`, `npm run build` |

CI does not currently provide a browser-level product-flow test.

## Manual authenticated verification

When a change affects product behavior, use test-owned accounts and an approved
local or non-production Supabase environment. Never copy tokens, service keys,
or database URLs into a test record.

The baseline manual vocabulary-loop flow is:

```text
sign in
→ create notebook
→ add vocabulary
→ open due review
→ submit answer
→ complete session
→ confirm progress/schedule change
```

For P1.1, also verify:

```text
return with due work
→ use the due-entry affordance
→ reach selected notebook study flow
→ observe bounded session / truthful remaining count
→ verify no-due empty state
```

Record the environment class, test-data setup, exact steps, result, and any
unverified limitation in the active spec’s **Verification evidence** section.

## Required verification by change type

| Change | Minimum verification |
| --- | --- |
| Pure backend policy/service | Focused pytest plus relevant backend suite. |
| Public route or contract | Update `API_CONTRACT.md` before code; focused API/OpenAPI or integration test; manual request/Swagger check when environment permits. |
| Migration/schema | Approved database authority and migration plan; Alembic checks; backup/rollback evidence before live deployment. |
| Frontend UI or API-client behavior | `npm run typecheck`, `npm run build`, and manual authenticated flow because no frontend behavior runner exists. |
| Cross-stack vertical slice | Relevant backend tests, frontend typecheck/build, and manual authenticated end-to-end flow. |
| Documentation-only change | Link/claim audit and `git diff --check`; no claim of product behavior verification. |

## Known coverage gap and target

A future approved quality task should add an automated core-loop E2E path for:

```text
sign in → create notebook → add vocabulary → due review → submit answer
→ complete session → progress changes
```

Tool choice, credentials, environment ownership, and test-data lifecycle are
not decided in this document. See `TECH_DEBT.md`; do not add Playwright, Vitest,
or another framework without an approved feature/quality specification.
