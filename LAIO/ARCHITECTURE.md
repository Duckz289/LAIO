# LAIO Architecture

## Style

LAIO is a modular monolith. A single FastAPI deployment and a single PostgreSQL
database are intentional until measured load or independent release cycles
justify service extraction.

## Bounded contexts

- **identity** — authentication and learner profile
- **vocabulary** — notebooks and vocabulary content
- **learning** — learning sessions and submitted answers
- **scheduling** — review schedule and the pure SM-2 policy
- **planning** — future deterministic study planner: selects session content
  from schedule state, learner profile, availability, and school context;
  records a reason per selection (see `STRATEGY.md`)
- **gamification** — future XP, streaks, and achievements
- **analytics** — progress summaries and recommendations

The planner and any AI assistance read learner state and write selections and
suggestions; they never mutate the SRS schedule policy, `ReviewHistory`, or
ownership. AI providers are adapters at the edge, like the dictionary
provider, and are never the source of truth for scheduling, mastery, or
learning history.

## Dependency rule

Domain policies are framework-free. Application services coordinate policies
and repository operations. SQLAlchemy, Supabase, and FastAPI remain adapters at
the edge. API handlers parse input, call one application service, and map the
result.

During the incremental rework, legacy SQLAlchemy models remain under
`app/core/models`; new behavior must not be placed in API handlers.

## Data ownership

Every user-scoped query must include the authenticated `user_id`. Child
resources are authorized through their parent when they do not carry a user ID.
Learning answers must verify both session ownership and vocabulary ownership.

## Transaction boundary

One HTTP request owns one synchronous SQLAlchemy session. The dependency commits
on success and rolls back on failure. Application services use `flush` but do
not commit.

## Scheduling

`VocabProgress` is the persisted review schedule. `ReviewHistory` is the
append-only record of answers and stores the before/after scheduling snapshot.
`LearningSession` groups answers into a user-visible study session.
