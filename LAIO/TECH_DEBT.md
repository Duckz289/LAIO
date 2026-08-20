# LAIO technical debt and operational gates

This register contains verified, unresolved constraints. It is not a product
roadmap: a debt item does not authorize implementation. A task that resolves an
entry needs an approved backlog/spec slice and the verification evidence named
there.

## Status vocabulary

- **Open** — verified and unresolved.
- **Deferred** — intentionally postponed until a stated trigger.
- **Resolved** — retained only when the resolution evidence is useful.

## Open debt

### TD-001 — Owner-approved canonical database schema source is absent

| Field | Detail |
| --- | --- |
| Status | Open |
| Severity | High operational risk |
| Area | Database authority and live-schema releases |
| Evidence | No owner-approved, version-controlled canonical schema SQL is available in this checkout. Alembic migrations (`backend/alembic/versions/`), ORM models, and `backend/tests/unit/test_schema_v2_contract.py` are only corroborating evidence. |
| Risk | A contributor could infer a canonical live schema from implementation artifacts and perform an unsafe migration, stamp, or deployment. |
| Exit criteria | The database owner restores or explicitly approves the canonical source, documents compatibility and migration/rollback procedure, and links that authority from the operating docs. |
| Related work | Any schema-changing task; P1.2 and P1.4 remain non-ready until their design and authority requirements are met. |

### TD-002 — No frontend behavioral/component/E2E test runner

| Field | Detail |
| --- | --- |
| Status | Open |
| Severity | Medium quality risk |
| Area | Frontend regression confidence |
| Evidence | `frontend/package.json` provides typecheck/build scripts but no checked-in unit, component, browser, or E2E runner. |
| Risk | Type/build checks can pass while an authenticated user flow is broken. |
| Exit criteria | An approved quality slice defines a test tool, owned environment, test-data lifecycle, and stable browser-level coverage appropriate to the app. |
| Related work | `TESTING.md`; future quality backlog item required. |

### TD-003 — Core vocabulary-loop browser flow lacks automated coverage

| Field | Detail |
| --- | --- |
| Status | Open |
| Severity | Medium quality risk |
| Area | Cross-stack learning behavior |
| Evidence | Backend tests cover service and integration behavior, but no automated frontend/browser test proves sign-in → notebook → vocabulary → due review → answer → completion → progress change. |
| Risk | Contract-compatible backend and type-correct frontend changes can still break the product’s primary loop. |
| Exit criteria | An approved test slice automates the documented core-loop path against an owned non-production environment and makes it part of the relevant CI/release gate. |
| Related work | `TESTING.md`; P1.1 requires manual authenticated verification until this is resolved. |

### TD-004 — Frontend lookup/CEFR remnants lack backend and contract support

| Field | Detail |
| --- | --- |
| Status | Open |
| Severity | Medium correctness risk |
| Area | Frontend API types/UI assumptions versus backend contract |
| Evidence | The backend has no dictionary lookup route/provider, no backend CEFR field, and no `0005` migration. The current public contract documents only implemented vocabulary behavior. Frontend lookup/CEFR remnants remain in the application code. |
| Risk | A future UI path can call a nonexistent endpoint or present data that the backend neither owns nor persists. |
| Exit criteria | Either remove the stale frontend remnants in an approved frontend-owned maintenance slice, or approve a full vertical feature spec with provenance, contract-first API design, persistence authority, error behavior, tests, and owner assignment. |
| Related work | `STRATEGY.md` current-state reconciliation; no P1 task authorizes this work. |

### TD-005 — Production observability and multi-replica safeguards are deferred

| Field | Detail |
| --- | --- |
| Status | Deferred until measured production need |
| Severity | Medium operational risk |
| Area | Scale, auth, rate limiting, and releases |
| Evidence | Current rate limiting is process-local; offset pagination is bounded; fallback Supabase-user verification can occur when local JWT verification is unavailable. Centralized structured logs, error tracking, service metrics, query tracing, distributed limits, cached asymmetric JWKS verification, and backup-restore rehearsal are not established release gates in this checkout. |
| Risk | Scaling or public production traffic could outgrow single-process safeguards without sufficient visibility, durable auditability, or recovery practice. |
| Exit criteria | Evidence of scale/release need leads to an approved operational specification with measurable budgets, ownership, security review, rollout, and rollback rehearsal. |
| Related work | `BACKLOG.md` security and scale gates. |

### TD-006 — Legacy game-session API is outside the active product surface

| Field | Detail |
| --- | --- |
| Status | Deferred |
| Severity | Low-to-medium maintenance risk |
| Area | Backend API scope |
| Evidence | Game-session routes remain mounted while core frontend navigation does not use them. |
| Risk | An unowned legacy surface increases maintenance and security review scope without a current product decision. |
| Exit criteria | A separately approved slice either gives the surface a product owner, UI, contract, and acceptance coverage, or removes it in a deliberate versioned breaking release. |
| Related work | `API_CONTRACT.md`; no current P1 task authorizes changes. |

## Resolved documentation discrepancies

The 2026-08-19 documentation pass reconciled the public contract with the
implemented notebook-scoped vocabulary search route and made PATCH canonical
while retaining deprecated PUT compatibility. These are not open debt items;
future code/contract drift should be recorded here only if it remains unresolved
after the affected documentation change.
