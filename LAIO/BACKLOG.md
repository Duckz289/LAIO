# LAIO Backlog

`STRATEGY.md` is the long-term roadmap. This file is its executable queue: it
records the next valid implementation slice, dependencies, evidence, and task
state without repeating strategy rationale. Product work and market discovery
run concurrently; G0 begins alongside P1.

## Task states

| Status | Meaning |
| --- | --- |
| `PLANNED` | Approved direction, but not yet executable. Do not implement it. |
| `READY` | The next eligible task: dependencies are `DONE`, a usable `READY` spec exists, required product/architecture/API decisions are resolved, and no blocker is known. |
| `IN_PROGRESS` | A single owner is implementing the linked spec. |
| `BLOCKED` | A named decision, dependency, authority, secret, or external prerequisite prevents safe work. |
| `DONE` | All acceptance criteria are satisfied, required checks and regression tests pass, and affected specs/contracts/docs contain evidence. |
| `DEFERRED` | Intentionally postponed; it is not eligible for selection. |

A task is never `DONE` merely because code appears present. If a required check
cannot run, retain `READY`, `IN_PROGRESS`, or `BLOCKED` and record why.

## Selection rules

1. Select the highest-priority `READY` task only.
2. Verify its linked spec is `READY` before editing code.
3. Implement one vertical slice; never pull an adjacent `PLANNED` task into the
   change.
4. A task that changes a public API or database needs those decisions resolved
   in its spec, with `API_CONTRACT.md` updated before implementation.
5. Update the spec verification evidence before moving the task to `DONE`.

## Completed — P0 Vocabulary Foundation

**Status:** `DONE` as the existing demonstrated slice; its protected behavior
is documented in `TESTING.md` and existing backend tests.

- Authenticated notebook and vocabulary ownership
- Notebook/vocabulary CRUD, bounded pagination, and server search
- Learning sessions, answer history, SRS snapshots, and completion accuracy
- Dashboard notebook/word/due metrics

P0 is not a blanket claim that every future UI or production scenario is
verified. Its remaining quality gaps belong in `TECH_DEBT.md`.

## Roadmap A — product/learning system

### P1 — Retention & Evidence Foundation

**Phase status:** `READY` — P0 establishes the base loop; P1.1 is the next executable slice.
**Active spec:** [`docs/specs/P1-retention-evidence.md`](docs/specs/P1-retention-evidence.md)
**Phase gate:** users return when reviews are due and can resume after absence;
G0 provides the first 20–30-tester / two-week evidence window. See
`STRATEGY.md` §10–§13 and §23.

| ID | Task | Status | Dependencies | Domain | Spec / completion evidence | Blocker |
| --- | --- | --- | --- | --- | --- | --- |
| P1.1 | Bounded return-when-due entry | `READY` | P0 | learning, scheduling, frontend | [P1 spec](docs/specs/P1-retention-evidence.md#p11--bounded-return-when-due-entry); acceptance IDs `P1-AC-001`–`P1-AC-007`; backend service/integration coverage, frontend typecheck/build, manual authenticated browser flow | None known. |
| P1.2 | Additive answer and session evidence | `PLANNED` | P1.1 `DONE` | learning, database, API | Same P1 spec; requires a field-level design, migration plan, API contract update, and tests before it can be `READY`. | Exact data minimization and public API shape are not approved. |
| P1.3 | Flexible weekly consistency view | `PLANNED` | P1.1 `DONE`, P1.2 decision | analytics, frontend | Same P1 spec; requires a defined calculation, UI copy, and acceptance IDs before it can be `READY`. | Weekly-window/product decision is unresolved. |
| P1.4 | Delayed-retention groundwork | `BLOCKED` | P1.2 `DONE` | scheduling, analytics, database | Same P1 spec; requires owner-approved persistence and selection semantics. | A delayed-check schedule must not be invented from current SRS state. |

**P1 safety rules:** keep the current SRS truthful; do not destructively move
an overdue item before its review; do not make the current daily streak the
primary retention claim; do not introduce a planner, profile, notifications,
or AI behavior under P1.

### Future product phases

These phases remain strategic until their dependencies and a feature spec make
them actionable. Do not select them merely because they are nearby.

| Phase | Status | Dependency / gate | Direction |
| --- | --- | --- | --- |
| P2 — Learner Profile + Availability + Minimal School Context | `PLANNED` | P1 product and G0 evidence evaluated | `STRATEGY.md` §5, §7, §8, §23 |
| P3 — Adaptive 5–10 Minute Vocabulary Planner | `PLANNED` | P2 and pre-planner P1 baselines | `STRATEGY.md` §9, §23 |
| P4 — Rich School Workflow | `BLOCKED` | G0/G1 must show school-linked planning value | `STRATEGY.md` §7, §15, §23 |
| P5 — Error Memory | `PLANNED` | P4 evidence and delayed-verification design | `STRATEGY.md` §6, §23 |
| P6 — Shared Knowledge/Skill Model | `PLANNED` | P5 evidence must show flat heuristics cap out | `STRATEGY.md` §14, §23 |
| P7 — Model-driven practice beyond vocabulary | `PLANNED` | Learner-model need and prior phase gates | `STRATEGY.md` §14, §23 |

## Roadmap B — market/user discovery

| ID | Status | Scope and evidence | Dependency |
| --- | --- | --- | --- |
| G0 | `PLANNED` | 8–12 THPT interviews, 20–30 two-week testers, and ≥5 THCS probe interviews; validates the wedge and return-when-due behavior. | Runs alongside P1; protocol in `STRATEGY.md` §4. |
| G1–G6 | `PLANNED` | Activation, acquisition, sharing, content, cluster, and paid-experiment stages. | Follow the gates in `STRATEGY.md` §15–§23. |

## Security and scale gates

These are not product tasks unless an approved spec makes them so.

- Cached JWKS verification for asymmetric Supabase signing keys
- Distributed rate limits and durable audit events when multiple replicas are justified
- Cursor pagination and measured query-performance budgets when evidence requires them
- Error tracking, service metrics, backup restoration, and migration rollback rehearsal before production schema releases
- Service extraction only after measured scaling or release-boundary evidence

## Roadmap safety rules

1. Never implement a `PLANNED`, `BLOCKED`, or `DEFERRED` task.
2. Never change public API or database schema implicitly.
3. Never introduce Redis, queues, microservices, vector databases, or an AI
   provider without an approved spec.
4. Never promote a hypothesis from `STRATEGY.md` into a product fact.
5. Never let an AI inference become source-of-truth learner state.
6. Never weaken ownership/security/SRS invariants for convenience.
7. Never mark a task `DONE` without verification evidence.
8. Never commit or push unless explicitly instructed.
