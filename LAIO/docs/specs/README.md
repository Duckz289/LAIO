# LAIO feature specifications

A feature spec is the missing execution layer between [`BACKLOG.md`](../../BACKLOG.md)
and implementation. It describes one approved vertical-slice delta; it does
not replace [`STRATEGY.md`](../../STRATEGY.md), the public
[`API_CONTRACT.md`](../../API_CONTRACT.md), or
[`ARCHITECTURE.md`](../../ARCHITECTURE.md).

## Lifecycle

| Status | Meaning |
| --- | --- |
| `DRAFT` | Being shaped; not eligible for implementation. |
| `READY` | Scope, dependencies, decisions, acceptance criteria, and verification are usable; a backlog task may be `READY`. |
| `IN_PROGRESS` | Implementation has begun against this exact spec. |
| `BLOCKED` | A named prerequisite or decision prevents safe implementation. |
| `DONE` | All linked task acceptance criteria and definition-of-done evidence are satisfied. |
| `SUPERSEDED` | Retained for history; another identified spec replaces it. |

A `READY` backlog task requires a matching `READY` spec. A spec can cover a
small phase with several work packages, but the backlog determines which one is
actually eligible. An agent must never interpret a phase-level spec as approval
to implement every work package.

## Authoring rules

1. Start from [`TEMPLATE.md`](TEMPLATE.md). Keep every mandatory heading even
   when the answer is “No API change” or “None known.”
2. Cite current-state evidence using stable module/file references, not fragile
   line numbers.
3. Label current facts separately from intended behavior, hypotheses, future
   work, and open questions.
4. Link the spec from its backlog task. Add the stable acceptance ID to tests
   where useful and record actual verification evidence before marking done.
5. If public HTTP behavior changes, update `API_CONTRACT.md` **before code**.
   If database structure changes, identify the owner-approved authority and
   migration plan; do not invent a canonical schema.
6. Keep explicit out-of-scope boundaries. A coding agent stops when a needed
   change lies outside the approved slice.

## Current active spec

- [`P1-retention-evidence.md`](P1-retention-evidence.md) — P1 phase wrapper;
  only backlog task **P1.1** is currently `READY`.
