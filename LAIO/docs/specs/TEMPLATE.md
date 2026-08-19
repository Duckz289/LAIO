# <Feature or phase name>

- **Spec ID:** `<phase-or-task-id>`
- **Status:** `DRAFT`
- **Backlog task(s):** [`<ID>`](../../BACKLOG.md)
- **Owner:** `<role or named owner>`
- **Last reviewed:** `<YYYY-MM-DD>`
- **Related authorities:** [Strategy](../../STRATEGY.md) · [Product](../../PRODUCT.md) · [Architecture](../../ARCHITECTURE.md) · [API contract](../../API_CONTRACT.md) · [Testing](../../TESTING.md)

## Status and implementation permission

State which exact backlog task(s) this spec authorizes. A phase-level spec must
state explicitly when it is only a wrapper and does **not** authorize all work
in the phase.

## Goal

Describe the user and product outcome. Separate confirmed product decisions
from hypotheses.

## Current state evidence

List observed behavior and its stable code, test, or contract references. Do
not present intended behavior as if it already runs.

## User flow

Describe the bounded happy path and the meaningful state transitions.

## Scope

### In scope

-

### Out of scope

-

## Functional behavior

Specify observable behavior and any ordering, limits, or business rules.

## UI states and copy

Describe loading, empty, error, success, and accessibility states relevant to
this slice. Use exact copy only when it is product-approved.

## API change

State **No API change** or list every public HTTP method, path, request field,
response field, and status-code change. Public API changes require
`API_CONTRACT.md` to be updated before code.

## Database and persistence

State **No database change** or identify the approved authority, migration plan,
data ownership, retention, and rollback considerations. Do not infer a
canonical schema from ORM models or migrations.

## Invariants and security

List ownership, scheduling, audit, authorization, privacy, and transaction
rules that must remain true.

## Edge cases and failure behavior

List important empty, stale, concurrent, unavailable-provider, and invalid-input
cases. State whether each condition is recoverable and what the user sees.

## Acceptance criteria

Use stable IDs, for example:

| ID | Criterion |
| --- | --- |
| `<PHASE>-AC-001` |  |

## Test and verification mapping

Map every acceptance criterion to a concrete automated test, manual procedure,
or both. Distinguish type/build checks from behavioral verification.

| Acceptance ID | Automated coverage | Manual verification | Evidence when done |
| --- | --- | --- | --- |
| `<PHASE>-AC-001` |  |  |  |

## Definition of done

-

## Dependencies and rollout

List preceding task IDs, required secrets or owners, feature flags, migration or
deployment steps, and rollback strategy. Say “None known” only after checking.

## Open questions and blockers

List unresolved decisions with an owner and the effect on implementation. A
question that prevents safe work means the relevant backlog task is not `READY`.

## Verification evidence

Record actual command results, manual checks, dates, and links to CI/PR evidence
only after they occur. Do not mark the spec `DONE` based on planned checks.
