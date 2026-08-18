# LAIO Backlog

Structured by the two concurrent roadmaps in `STRATEGY.md` (§14–§23). Each
phase is a vertical slice with a product gate AND a market gate; a phase does
not start until the previous phase's gates are evaluated. Product work and
market discovery run in parallel — G0 starts alongside P1.

## Completed — P0 basic vocabulary demo

- Stable local setup checks, migrations, bounded API client, dependency audits
- Register/login/logout and authenticated notebook/vocabulary ownership
- Notebook and vocabulary CRUD, server search/filter, paged vocabulary loading
- Learning sessions, answer history, SRS snapshots, completion accuracy
- Dashboard notebook/word/due metrics and critical regression tests

## Roadmap A — product/learning system

### P1 — Retention & Evidence Foundation (next)

- Return-when-due surface: due preview and one-tap session start
- Absence-safe review entry: cap daily load, order by forgetting risk,
  redistribute the remainder honestly (no destructive rescheduling)
- Extended evidence capture (additive): prompt direction and activity mode
  per answer, submitted answer for typing/choice, session origin and planned
  time budget
- Weekly flexible consistency view (demote daily streak from primary)
- Delayed-retention-check groundwork (7/30-day re-test scheduling concept)
- Gate: users return when reviews are due; post-absence continuation holds
  (measured on G0's testers)

### P2 — Learner Profile + Availability + Minimal School Context

- `UserLearningProfile`: grade (only required field), goal, weekly time
  budget, default session target
- Availability: day-level weekly template, max daily load, "busy today"
- Minimal school context: optional book/unit labels, vocabulary source tag
  (school / self-study / other), optional test date + scope
- Gate: optional fields get filled without hurting onboarding; interviewees
  recognize the fields as describing their real study life

### P3 — Adaptive 5–10 Minute Vocabulary Planner

- Deterministic gate-based selection (due → weak → school-relevant → explore)
  under 5/10/20-minute budgets; reason code stored per selection
- Home becomes "what's worth doing today"; every item can answer "why am I
  seeing this?"
- Planner selection snapshots persisted for future baseline comparison
- Gate: sessions complete under real budgets without hurting delayed
  retention; users voluntarily return to the planner over the manual queue

### P4 — Rich School Workflow (blocked on G0/G1 evidence that students value school-linked planning)

- Test-error capture (learner-entered), unit transitions, richer curriculum
  topic metadata, small personal vocabulary imports
- Gate: entered errors and unit updates measurably change plans; test-week
  return behavior improves

### P5 — Error Memory

- Deterministic weakness records (item- and tag-level) with lifecycle
  observed → recurring → improving → recovered (delayed-check verified)
- AI classification suggestions only, learner-confirmable, never source of
  truth
- Gate: learners recognize surfaced weaknesses as true and act on them

### P6 — Shared Knowledge/Skill Model

- Concept taxonomy and relationships, introduced only when P5 evidence
  demands it and flat heuristics demonstrably cap out
- Gate: beats the heuristics offline on the same data; personalization beats
  a non-personalized baseline for users

### P7 — Model-driven practice beyond vocabulary

- Grammar/reading micro-activities introduced because the learner model
  identifies needs vocabulary cannot serve — never as standalone feature tabs
- Gate: each activity traces to a learner-model need and is used inside
  daily sessions

## Roadmap B — user/market (concurrent)

- **G0 (runs alongside P1):** 8–12 THPT interviews + 20–30 hand-recruited
  THPT testers for 2 weeks + ≥5-interview THCS probe; decides the wedge
  hypothesis (`STRATEGY.md` §3–§4)
- **G1:** activation experiment — capture-led first-value flow; measure the
  activation event and time-to-value
- **G2:** repeatable school-network acquisition via 2–5-friend clusters
- **G3:** first shareable public artifact (study pack, then unit readiness
  check from original content); value before signup
- **G4:** content + SEO experiments (pain-first, every piece routes to a
  product action)
- **G5:** school-cluster growth at scale
- **G6:** paid acquisition experiments — only after organic economics are
  understood

Cross-roadmap rules: no P4 if G0/G1 show school-context indifference; no
viral/class features until organic sharing appears in G2/G3; distribution
never waits for the product roadmap.

## Security and scale gates

- Cached JWKS verification for projects using asymmetric Supabase signing keys
- Distributed rate limiting and durable audit events (in-process limits exist)
- Cursor pagination and measured query-performance budgets (bounded offset pagination exists)
- Error tracking, service metrics, and tested backup restoration
- Extract a service only after measured scaling or release-boundary evidence
