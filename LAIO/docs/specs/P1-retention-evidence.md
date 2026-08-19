# P1 — Retention & Evidence Foundation

- **Spec ID:** `P1`
- **Status:** `READY` for P1.1 only
- **Backlog task(s):** [P1.1](../../BACKLOG.md#p1--retention--evidence-foundation), P1.2–P1.4 are not authorized
- **Owner:** Product and implementation owners
- **Last reviewed:** 2026-08-19
- **Related authorities:** [Strategy](../../STRATEGY.md) · [Product](../../PRODUCT.md) · [Architecture](../../ARCHITECTURE.md) · [API contract](../../API_CONTRACT.md) · [Testing](../../TESTING.md)

## Status and implementation permission

This is a P1 phase wrapper. It authorizes **only P1.1 — bounded
return-when-due entry** because that is the sole `READY` P1 backlog task.

P1.2 (additive answer and session evidence), P1.3 (flexible weekly consistency),
and P1.4 (delayed-retention groundwork) remain future work. Their data,
calculation, and selection decisions are not approved by this specification.
A coding agent must not implement them while completing P1.1.

## Goal

Give a returning learner a bounded, truthful way to enter work that is already
due, without changing the current SRS schedule before a review is answered.

This slice validates a return-when-due entry path. It does not claim that
oldest-due ordering is a forgetting-risk model or that the existing daily streak
measures retention.

## Current state evidence

The current P0 loop already provides components of the entry path:

- `backend/app/services/review_service.py` selects due vocabulary where the
  persisted next-review date is due, ordered by oldest due date and then item
  creation time, with a bounded result limit.
- `backend/app/api/v1/reviews.py` exposes `GET /reviews/due`; its default and
  maximum response limit are bounded.
- `backend/app/services/learning_service.py` creates a learning session with
  `planned_items` capped by the requested bounded limit, and immediately marks
  a zero-due session completed.
- `backend/app/schemas/learning.py` bounds a session creation limit to 1–50,
  with a default of 20.
- `frontend/src/app/notebooks/page.tsx` loads progress summary data and routes
  a learner with due work through the dashboard/notebook entry flow.
- `frontend/src/app/notebooks/[id]/page.tsx` loads due reviews, creates a
  learning session, and handles the notebook auto-study marker stored by the
  notebook-list entry point.
- `backend/tests/integration/test_learning_service.py` and
  `backend/tests/integration/test_mvp_queries.py` cover existing session and
  due-total behavior. They do not by themselves prove the authenticated browser
  flow.

These are current implementation facts, not proof that P1.1 is complete.

## User flow

1. An authenticated learner returns after time away and sees the existing due
   count/entry affordance when one or more vocabulary items are due.
2. The learner chooses the existing review entry action. The app selects a
   notebook with due work and opens the current notebook study flow.
3. The flow requests due items and starts one bounded vocabulary learning
   session for that notebook.
4. The learner reviews items in the returned due order and submits answers
   through the existing learning-session flow.
5. If no items are due at entry or the due set becomes unavailable, the UI shows
   a clear non-study/empty state rather than implying there is work to review.
6. A session may contain only the bounded currently planned number of items;
   any remaining due count remains truthful and is not silently represented as
   completed.

## Scope

### In scope

- Verify and, if necessary, make the existing authenticated return-when-due
  entry flow reliable from the due affordance to a bounded learning session.
- Preserve the current 20-item default session boundary and server-side 1–50
  permitted limit.
- Present a truthful due preview/remaining-work state: the full due total must
  not be confused with the number of items loaded into a bounded review response
  or session.
- Preserve oldest-due-first ordering currently supplied by the review service.
- Add focused backend/service or API-surface coverage needed to demonstrate the
  bounded entry contract, plus manual authenticated browser verification.

### Out of scope

- New public endpoints, request/response fields, or status codes.
- Database schema changes, migrations, or retention-data expansion.
- Rescheduling, postponing, or otherwise changing a due item before an answer
  is submitted through the established learning/review path.
- A new SRS algorithm, a claimed forgetting-risk ranker, or altered answer
  scoring semantics.
- Notifications, email, push reminders, planner/profile features, AI behavior,
  gamification, or a weekly consistency dashboard.
- P1.2/P1.3/P1.4 data design or implementation.

## Functional behavior

### P1.1 — bounded return-when-due entry

1. The entry flow is available only from authenticated product surfaces already
   guarded by the application’s auth behavior.
2. When due work exists, one user action enters a notebook study flow whose due
   request and session creation are scoped to the selected notebook.
3. The server remains authoritative for due eligibility, ownership, session
   limit enforcement, and session state. Client-side due counts must not grant
   permission to answer a non-due or unowned item.
4. A new session remains bounded by the server’s configured request limit: the
   default is 20 and the allowed request range is 1–50. `planned_items` must not
   exceed currently due items.
5. The current due-list ordering remains next-review date ascending, then
   vocabulary creation time ascending. This is an implementation ordering, not a
   new retention-priority claim.
6. A due item is not destructively rescheduled merely because the learner has
   returned after absence, opened a notebook, viewed a preview, or started a
   session. Existing review submission remains the state-changing operation.
7. If no due work exists for the selected notebook, the system must not present
   a false active review. The existing completed/empty-session behavior and a
   clear frontend empty state are acceptable; implementation should avoid a
   blank or indefinitely loading study view.
8. Where a due total is displayed, it represents all currently due items under
   the same scope. It must remain distinguishable from a bounded list response,
   current session `planned_items`, or number already answered.
9. Starting a new session may retain the existing invariant that a prior active
   session for that user is abandoned. This P1.1 slice does not add session
   resume semantics.

## UI states and copy

The implementation should reuse the established product visual system and may
refine existing Vietnamese copy during the slice. It must make these states
unambiguous:

| State | Required behavior |
| --- | --- |
| Loading due summary or study data | Show progress/loading feedback; do not expose a usable action until its required data is ready. |
| One or more items due | Show the existing review entry affordance and a truthful due count or equivalent preview. |
| Bounded session started | Make the selected notebook and current item/session state understandable; do not label the session size as the full due total. |
| No due items | Show a clear empty/completed state and no false claim that a review is in progress. |
| Request/session error | Show recoverable error feedback and preserve an obvious retry/back navigation path. |
| Auth session absent | Follow the existing auth guard/redirect behavior rather than rendering protected review data. |

Accessibility and responsive behavior should match adjacent dashboard, notebook,
and study views. Exact copy is not newly prescribed by this spec.

## API change

**No API change.** P1.1 uses the existing due-review and learning-session
endpoints described in `API_CONTRACT.md`. Any implementation discovery that
requires a public HTTP change is out of scope until the contract and this spec
are revised and the backlog task is re-approved.

## Database and persistence

**No database change.** P1.1 uses existing `VocabProgress`, `LearningSession`,
and append-only `ReviewHistory` persistence.

The owner-approved canonical database schema source is unavailable in this
checkout. Alembic migrations, ORM models, and schema-alignment tests are
corroborating evidence only. This slice must not create or infer a new canonical
schema.

## Invariants and security

- All selected vocabulary, due queries, sessions, and answers remain scoped to
  the authenticated user.
- A user may have at most one active learning session; creating a new one keeps
  the existing prior-active-session abandonment behavior.
- A submitted answer must belong to the caller’s session and vocabulary, be due,
  and not duplicate an answer for that vocabulary in the same session.
- Scores remain 0–5; scores of 3 or higher remain correct.
- `VocabProgress` remains the current schedule. `ReviewHistory` remains
  append-only evidence with before/after schedule snapshots.
- `is_mastered` remains a UI flag and must not remove due vocabulary from the
  SRS queue.
- No client count, session-storage marker, or UI state becomes a source of
  truth for ownership, due eligibility, or schedule mutation.

## Edge cases and failure behavior

| Condition | Required behavior |
| --- | --- |
| Learner has no due vocabulary anywhere | Do not select an arbitrary notebook or display a false review; show the established empty/non-study state. |
| Selected notebook has no due vocabulary | Preserve a clear empty/completed state; do not create a misleading active review UI. |
| More items are due than the bounded review/session limit | Show or retain the full due total distinctly; review only the bounded session set. |
| Due items change between preview and session creation | The server decides the current due set and planned count; the client recovers cleanly from an empty or changed result. |
| Learner opens entry twice or starts another session | Preserve the existing one-active-session invariant; no duplicate active sessions. |
| Unowned/missing notebook or vocabulary | Keep existing authorization/not-found behavior; never disclose another learner’s due data. |
| Network or server error | Do not mutate the schedule locally; show retryable feedback. |
| Learner returns after a long absence | Do not bulk reschedule or silently clear overdue work before answer submission. |

## Acceptance criteria

| ID | Criterion |
| --- | --- |
| `P1-AC-001` | An authenticated learner with due vocabulary can use the existing entry affordance to reach the selected notebook’s study flow in one intentional action. |
| `P1-AC-002` | Session creation remains server-bounded: default planning is at most 20 items, requested limits are constrained to 1–50, and `planned_items` never exceeds current due work. |
| `P1-AC-003` | The due review path preserves the current oldest-due-first ordering (next-review date ascending, then vocabulary creation time ascending) without representing it as a new risk model. |
| `P1-AC-004` | Entering, previewing, or starting a review does not change an item’s persisted SRS schedule before a valid answer is submitted. |
| `P1-AC-005` | When no due work exists, the authenticated entry/study flow shows a clear empty or completed state and does not imply an active review. |
| `P1-AC-006` | A displayed due total is distinguishable from a bounded fetched list, `planned_items`, and answered-item count; remaining due work is not misrepresented as completed. |
| `P1-AC-007` | The entry path preserves ownership, due-only answering, one-active-session, duplicate-answer prevention, and no cross-user data exposure. |

## Test and verification mapping

| Acceptance ID | Automated coverage | Manual verification | Evidence when done |
| --- | --- | --- | --- |
| `P1-AC-001` | Extend backend API/service coverage only if the current tests do not establish notebook-scoped due/session creation. | Sign in with a due notebook; use the existing review action and verify it opens that notebook’s study flow. | Named pytest result plus authenticated browser notes. |
| `P1-AC-002` | `backend/tests/unit/test_learning_schemas.py`; `backend/tests/integration/test_learning_service.py`. Add a focused regression test if the P1.1 change can regress planned-count bounds. | Verify a notebook with more than 20 due items begins a bounded session. | Pytest result and observed session UI/count. |
| `P1-AC-003` | `backend/tests/integration/test_mvp_queries.py` or a focused review-service test asserting the documented order. | Seed/use distinguishable overdue items and confirm the visible order when practical. | Test name/result; manual note if environment supports it. |
| `P1-AC-004` | `backend/tests/integration/test_learning_service.py` schedule/history coverage; add a regression test around entry/session creation if needed. | Inspect an overdue item before and after opening/starting, then after submitting an answer. | Test result and manual observation. |
| `P1-AC-005` | Existing empty-session service coverage in `backend/tests/integration/test_learning_service.py`; add UI-safe regression coverage where available. | Sign in with no due items and use the entry/study path; verify clear empty/completed feedback. | Pytest result and authenticated browser note. |
| `P1-AC-006` | `backend/tests/integration/test_mvp_queries.py` due-total-not-truncated coverage; add focused test if response/UI contract changes. | Use more due items than the fetched/session cap and confirm full total is not labeled completed. | Test result and browser note. |
| `P1-AC-007` | Existing learning-service ownership, duplicate-answer, and active-session tests; run relevant backend suite. | Use only test accounts owned by the verifier; confirm protected routes redirect when signed out. | Pytest result and manual auth-flow note. |

Frontend typecheck and production build are required regression checks, but they
are not behavioral proof because this repository has no frontend component or
E2E runner. Follow the command matrix in `TESTING.md`.

## Definition of done

- P1.1 implementation changes only the behavior necessary to satisfy
  `P1-AC-001` through `P1-AC-007`.
- No public API or database change is introduced; otherwise stop and revise the
  contract/spec/backlog before proceeding.
- Relevant backend tests pass, including focused additions/updates justified by
  the actual diff.
- `frontend` typecheck and build pass.
- An authenticated browser flow verifies due entry, bounded review behavior, and
  the no-due state; limitations and test data are recorded.
- The implementation does not regress the listed invariants.
- Actual command/manual evidence is recorded below, then P1.1 may move to
  `DONE` in `BACKLOG.md`. P1.2–P1.4 remain unchanged.

## Dependencies and rollout

- **Dependency:** P0 vocabulary foundation is the existing demonstrated base.
- **Required secrets/services:** Standard authenticated local/test environment
  only; P1.1 does not require a new provider or secret.
- **Migration/deployment:** None.
- **Rollback:** Revert the bounded entry-flow implementation if it causes a
  regression; no persisted data migration is introduced.

## Open questions and blockers

| Item | Owner | Effect |
| --- | --- | --- |
| Exact additive answer/session evidence fields and retention window for P1.2 | Product/data owner | P1.2 remains `PLANNED`; do not add fields in P1.1. |
| Weekly consistency calculation, window, and learner-facing copy for P1.3 | Product owner | P1.3 remains `PLANNED`. |
| Delayed-check schedule and selection semantics for P1.4 | Product/data owner | P1.4 remains `BLOCKED`; do not derive it from current SRS dates. |
| Owner-approved canonical schema source | Repository/database owner | No schema change is permitted until this authority is restored or explicitly approved. |

## Verification evidence

Documentation preparation completed 2026-08-19. No P1.1 product implementation
or behavioral verification was performed as part of this documentation-only
pass. Populate this section with real commands, test names, browser steps, and
results when P1.1 is implemented.
