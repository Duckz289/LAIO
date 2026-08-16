# LAIO Backlog

## Completed — basic vocabulary demo

- Stable local setup checks, migrations, bounded API client, dependency audits
- Register/login/logout and authenticated notebook/vocabulary ownership
- Notebook and vocabulary CRUD, server search/filter, paged vocabulary loading
- Learning sessions, answer history, SRS snapshots, completion accuracy
- Dashboard notebook/word/due metrics and critical regression tests

## Next — personalization

- `UserLearningProfile`: level, goals, daily time budget, preferred skills
- Rule-based activity selection using history, difficulty, and time budget
- Real progress dashboard: retention, weak vocabulary, accuracy, and streak
- Recovery and continuation of abandoned learning sessions

## Later — all-in-one skills

- Listening and pronunciation activities
- Level-appropriate reading
- Grammar activities
- Speaking recording and feedback
- Writing feedback
- TOEIC/IELTS roadmaps

## Security and scale gates

- Cached JWKS verification for projects using asymmetric Supabase signing keys
- Distributed rate limiting and durable audit events (in-process limits exist)
- Cursor pagination and measured query-performance budgets (bounded offset pagination exists)
- Error tracking, service metrics, and tested backup restoration
- Extract a service only after measured scaling or release-boundary evidence
