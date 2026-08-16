# LAIO Technical Debt

Current audit: 2026-08-16. The basic vocabulary demo slice is implemented and
covered by backend regression tests plus frontend typecheck/build. This file
tracks production gates beyond the single-instance demo, not placeholder MVP
features.

## External deployment gates

- Port `8001` on the audited machine was occupied by a non-LAIO application.
  `START_LOCAL.cmd` now refuses to start in that state. Stop the other service
  or change both the backend port and `BACKEND_INTERNAL_URL` together.
- A Supabase database created directly from schema-v2 SQL must be backed up,
  verified, stamped at `0003`, and upgraded to `0004` by the database owner.
  Do not replay `0001`–`0003` over an existing schema-v2 database.
- A confirmed Supabase test account is still required for a real browser smoke
  test of register/login/logout and bearer-token authorization.

## Scale gates

- Rate limiting is bounded and safe for one process. Before multiple API
  replicas, enforce the same limits at a gateway or Redis so counters are
  shared across instances.
- Notebook/vocabulary APIs use bounded offset pagination. Move high-churn,
  high-volume lists to cursor pagination after measured need.
- Projects without an HS256 Supabase secret verify tokens through the Supabase
  user endpoint. Add cached asymmetric JWKS verification if auth latency or
  availability measurements justify it.
- Add centralized structured logs, error tracking, latency/error-rate metrics,
  and database query tracing before public production traffic.
- Exercise backup restoration and migration rollback in staging before every
  production schema release.

## Maintenance gates

- Frontend `npm audit` and backend `pip-audit` were clean on 2026-08-16 after
  dependency upgrades. Keep both checks in CI because advisory status changes.
- FastAPI/Starlette currently warns that its legacy `httpx` TestClient path
  will move to `httpx2`; migrate the test client when upstream completes that
  transition.
- The legacy game-session backend surface remains outside the MVP and has no
  core navigation. Either define a separate product milestone with UI and
  acceptance tests or remove that API in a deliberate breaking release.
