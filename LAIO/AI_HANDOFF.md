# LAIO implementation handoff

Use this document with `CLAUDE.md` when handing LAIO to a coding agent or a
new collaborator. It routes each decision to its canonical document; it does
not replace those documents.

## Required read order

1. Run `git status`, `git branch --show-current`, and `git log -1 --oneline`.
2. Read `CLAUDE.md` for the authority matrix, conflict protocol, and stop
   conditions.
3. Read `STRATEGY.md`, `PRODUCT.md`, and `BACKLOG.md` to establish direction,
   current milestone, and task state.
4. For implementation work, open the linked active spec in `docs/specs/`.
   Do not start a task without a `READY` spec.
5. Read the relevant parts of `ARCHITECTURE.md`, `API_CONTRACT.md`, and
   `TESTING.md`.
6. Read the implementation in this order where applicable: models/migrations
   → Pydantic schemas → services → routes → frontend API client → UI → tests.
7. Read `TECH_DEBT.md` for unresolved constraints. Treat
   `CONTEXT_SNAPSHOT.md` as historical context only.

## Authority and conflict rules

The concern-specific authority matrix lives in `CLAUDE.md`. In short:

- code shows what runs **today**;
- an active feature spec defines the approved behavior a current task intends
  to introduce;
- `API_CONTRACT.md` is the public HTTP contract and changes before API code;
- `STRATEGY.md` governs long-term direction, while `PRODUCT.md` and the active
  spec govern current approved scope;
- tests protect already-executable behavior;
- `CONTEXT_SNAPSHOT.md` never overrides a current authority.

Report a code/contract or architecture/spec mismatch before editing. Do not
silently choose a source or invent a table, field, route, provider, or
migration to bridge the gap.

## Database authority warning

The owner-approved, version-controlled canonical schema SQL referenced by older
handoffs is **not available in this checkout**. Do not reconstruct and label a
new `schema.sql` as canonical from models or Alembic.

Until the original source is restored and owner-approved, use these only as
corroborating implementation evidence:

- `backend/alembic/versions/` for the tracked migration chain;
- `backend/app/core/models/` for the ORM representation;
- `backend/tests/unit/test_schema_v2_contract.py` for tested assumptions.

A schema change that cannot be resolved from an approved spec plus this evidence
is a stop condition. Record the uncertainty in `TECH_DEBT.md`; do not deploy,
stamp, or migrate a live Supabase database without explicit owner approval and
backup.

## Architecture and invariants

LAIO is a modular monolith:

```text
Supabase PostgreSQL
        ↑
SQLAlchemy models ← application services ← FastAPI routes ← frontend api.ts
```

- Routes parse input, call application services, and map responses.
- Business rules, ownership checks, and transaction coordination stay in
  services. Every user-scoped query filters by authenticated `user_id`.
- One HTTP request has one SQLAlchemy session. Services use `flush`; the DB
  dependency commits or rolls back.
- `VocabProgress` is one current schedule per `(vocab_item_id, user_id)`.
  The live schema is expected to create it through
  `trg_vocab_items_create_progress`; the service's guarded fallback exists for
  environments without that trigger and must not create duplicates.
- `ReviewHistory` is append-only and retains the before/after schedule snapshot.
- A learning session is `active`, `completed`, or `abandoned`; a user may have
  one active session. New sessions abandon a prior active session.
- An answer must own both its session and vocabulary; it must be due; the same
  vocabulary cannot be answered twice in one session. Scores are 0–5 and
  scores ≥3 are correct.
- `is_mastered` is a UI flag. It must not remove an item from the SRS due queue.
- Planner/AI/provider output is advisory or derived; it cannot replace learner
  state, ownership, schedule truth, or recorded review evidence.

See `ARCHITECTURE.md` for boundaries and `docs/specs/` for feature-specific
invariants.

## Public API rule

Base URL: `/api/v1`; product endpoints require a Supabase bearer token. Read
`API_CONTRACT.md` before editing either side of an API. Any public route,
method, request field, response field, or status-code change requires its
contract update **before** implementation.

Current update methods are `PATCH /notebooks/{notebook_id}` and
`PATCH /vocab-items/{vocab_id}`. `PUT` remains deprecated compatibility only.
The contract, not this summary, is the complete route list.

Frontend product calls go through `frontend/src/lib/api.ts` domain methods;
page/component code must not call backend product endpoints directly.

## Safe implementation workflow

1. Select only the highest-priority `READY` backlog task whose spec is `READY`.
2. Verify dependencies and blockers; stop if a required decision remains open.
3. Search all consumers of affected models, fields, routes, and UI state.
4. Keep the change to the spec's vertical slice. Do not implement nearby
   `PLANNED` work, future phases, new infrastructure, or a new AI provider.
5. Add or update the tests named by the spec.
6. Run the relevant checks from `TESTING.md`; perform manual verification where
   automation is unavailable.
7. Add verification evidence to the spec and update the backlog status only
   after the defined done conditions hold.
8. Report files changed, checks/results, and remaining risks. Never commit or
   push unless explicitly told to do so.

## Secrets and external services

Do not send `.env`, `.env.local`, Supabase service keys, JWT secrets, database
URLs, bearer tokens, or Vbee credentials to another agent or collaborator.
Vbee credentials stay server-side in `backend/.env`; external-provider failure
must not corrupt or invalidate learner state.

## Stop and report

Stop and state the blocker when there is no valid `READY` task/spec, an
unresolved product or architecture contradiction, database authority
uncertainty, an unavailable required secret, a destructive migration/deployment
requirement, or scope expansion beyond the approved spec. Do not convert a
strategy hypothesis into an implementation decision.
