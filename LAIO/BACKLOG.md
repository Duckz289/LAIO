# LAIO Backlog

## Now — foundation and vocabulary vertical slice

- Stable local setup, migrations, CI, and typed API client
- Authenticated notebook and vocabulary ownership
- Learning sessions, answer history, SRS snapshots, and progress summary
- Production build and critical unit/integration tests

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
- Endpoint rate limiting and audit events
- Pagination and query-performance budgets
- Error tracking, service metrics, and tested backup restoration
- Extract a service only after measured scaling or release-boundary evidence
