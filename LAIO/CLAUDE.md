# LAIO agent operating contract

Read this file before modifying LAIO. It defines how an implementation agent
turns approved product direction into **one** safe vertical slice; it is not a
replacement for the product, architecture, contract, or feature-spec documents.

## Mandatory first checks

1. Run `git status`, `git branch --show-current`, and `git log -1 --oneline`.
   Never rely on a document's branch, commit, migration-head, or deployment
   claim without verifying the checkout and relevant source.
2. Read `AI_HANDOFF.md`, then the documents named in its required read order.
3. Read the relevant existing tests before changing implementation.
4. Do not read, print, commit, or share `.env*`, access tokens, JWT secrets,
   service keys, or database URLs.

## Concern-specific authorities

| Concern | Canonical authority | How to use it |
| --- | --- | --- |
| Long-term product strategy | `STRATEGY.md` | Thesis, hypotheses, phase order, and gates. |
| Current product direction and milestone scope | `PRODUCT.md` | Working product summary; it does not override approved long-term strategy. |
| Execution order and task state | `BACKLOG.md` | The only place to select the next `READY` task. |
| Behavior intended by current work | Active `docs/specs/*.md` | Required for a `READY` or `IN_PROGRESS` task; defines the approved delta, not today's behavior. |
| Public HTTP behavior | `API_CONTRACT.md` | Update this **before code** for any public route, method, request field, response field, or status-code change. |
| Domain boundaries and invariants | `ARCHITECTURE.md` | Preserve ownership, transaction, SRS, and adapter boundaries. |
| Database structure | Owner-approved, version-controlled canonical SQL when restored | No such canonical SQL is currently available; see `TECH_DEBT.md` and use migrations, models, and schema tests only as corroborating evidence. |
| Agent working process | This file and `AI_HANDOFF.md` | Read together; link to canonical documents instead of copying them. |
| Known unresolved work | `TECH_DEBT.md` | Do not silently fix unrelated debt. |
| Current executable protections | Tests and CI configuration | Tests describe protected behavior, not untested product intent. |
| Historical context | `CONTEXT_SNAPSHOT.md` | Context only; it never overrides a current authority. |

## Conflict protocol

- **Code versus active spec:** code describes what runs today; the active
  `READY`/`IN_PROGRESS` spec describes the approved change. Compare them,
  implement only the delta, and add verification. A spec never authorizes
  behavior outside its stated scope.
- **Code versus API contract:** report the mismatch before editing. Do not
  silently reinterpret either source. Reconcile the contract before changing
  public behavior.
- **Strategy versus current scope:** `STRATEGY.md` governs long-term direction;
  `PRODUCT.md` and an approved active spec govern the current slice. A strategy
  hypothesis is not a product fact.
- **Database uncertainty:** never manufacture a schema source of truth from
  SQLAlchemy or Alembic. Stop for owner-approved schema clarification when a
  schema decision cannot be safely derived from applied migrations.
- **Historical context:** `CONTEXT_SNAPSHOT.md` is non-authoritative and cannot
  settle a conflict.

Record verified documentation/code discrepancies in the task report and, when
within scope, reconcile the relevant current documentation. Record code defects
outside the slice in `TECH_DEBT.md`.

## Ownership and non-negotiable rules

- Backend owner owns `backend/**`; frontend owner owns `frontend/**`. Do not
  cross those boundaries unless the user explicitly requests it. State any
  approved cross-boundary change in the handoff/PR.
- Every user-scoped query filters by authenticated `user_id`; child resources
  are authorized through their parent.
- Route handlers parse and map; application services hold business rules;
  services `flush` but do not commit; one HTTP request owns one DB session.
- `VocabProgress` is the current SRS schedule. `ReviewHistory` is append-only
  evidence. `is_mastered` is a UI flag, not an SRS exclusion.
- AI or external providers may not become the source of truth for learner
  state, scheduling, ownership, or recorded history.
- Components use domain methods from `frontend/src/lib/api.ts`; do not add
  direct product-data calls from page/components.
- Never add a route, table, migration, infrastructure service, AI provider, or
  architectural mechanism unless a `READY` spec explicitly requires it.
- Never commit, push, deploy, migrate a live database, or delete data without
  explicit user authorization.

## Autonomous roadmap mode

When told “continue the roadmap” or “implement the next ready LAIO task,” do
exactly this:

1. Detect the Git state and read the required context in `AI_HANDOFF.md`.
2. Read `BACKLOG.md`; select the highest-priority valid `READY` task only.
3. Verify that its linked spec exists, is `READY` for the selected task,
   explicitly lists or authorizes the selected backlog task ID, has no
   unresolved blocking decision, and identifies API/database impact.
4. Read the relevant `ARCHITECTURE.md`, `API_CONTRACT.md`, implementation, and
   existing tests. Report any contradiction before editing.
5. Implement one vertical slice only; do not pull adjacent `PLANNED` work into
   the change.
6. Add/update the test layers required by the spec and run the required checks.
7. Update the spec with verification evidence, then update the backlog task
   status. `DONE` requires all documented evidence; an unrun check means it is
   not `DONE`.
8. Report changed files, checks run/results, contract/database impact, and
   unresolved risks. Do not commit or push unless explicitly instructed.

### Stop conditions

Stop rather than inventing a solution when any of these applies:

- no valid `READY` task exists;
- its spec is missing, not `READY`, or does not resolve a required decision;
- architecture or API-contract contradiction remains unresolved;
- database source-of-truth uncertainty blocks a schema decision;
- a required secret or external-service configuration is unavailable;
- the slice requires a destructive migration or deployment;
- the requested work would expand beyond the approved spec.

State the exact blocker and the document/source that must resolve it.

## Completion baseline

- For backend changes, run the relevant pytest coverage; manually exercise a
  changed authenticated route with authorized credentials when the environment
  permits.
- For frontend changes, run `npm run typecheck` and `npm run build`, then
  manually exercise the affected user flow. These checks are not behavioral UI
  tests; follow `TESTING.md` for the required verification layer.
- For public contract changes, update `API_CONTRACT.md` before implementation.
- For technical debt discovered or resolved in scope, update `TECH_DEBT.md`.
- Finish with `git diff --check` and report anything that could not be run.
