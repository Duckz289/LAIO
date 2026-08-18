# LAIO Product Direction

`STRATEGY.md` is the long-form strategy of record (thesis, wedge hypothesis,
roadmaps, gates, go-to-market). This file is the working summary. When they
disagree, `STRATEGY.md` wins for strategy; this file and `API_CONTRACT.md`
win for the current milestone's scope.

## Product promise

LAIO is the persistent learning memory and decision system for a Vietnamese
secondary/high-school student's English learning. School provides curriculum
and context; LAIO provides individual memory, diagnosis, prioritization,
scheduling, and continuity. The end state it moves toward:

> "What is the highest-value English study I can do in the next 5–10
> minutes?" — answered differently for different learners, even in the same
> class, with an explanation for every selection.

The proven first loop, which remains the foundation:

> sign in → create a notebook → add vocabulary → review due vocabulary →
> rate recall → SRS schedule and history update → see measurable progress →
> return when review is due

## Target learner (hypothesis, not committed fact)

Leading wedge hypothesis: **THPT grades 10–11**, chosen for founder access to
real testers, device/study autonomy fitting 5–10 minute self-directed
sessions, and steady unit-test cadence. Grades 8–9 remain a live alternative;
the G0 wedge-validation study (`STRATEGY.md` §3–§4) decides. Exam context is
province-dependent since 2025 (rotating thi-vào-10 third subject; elective
THPT English), so school unit tests — not exams — are the universal anchor.

## Current milestone

The basic vocabulary demo vertical slice is implemented. Its acceptance flow
is: register/sign in → create a notebook → add/edit/search vocabulary →
review due flashcards → see updated due counts and accuracy → sign out.
Vocabulary, scheduling, sessions, and analytics use real user-scoped data;
loading, empty, retry, validation, and authentication failure states are part
of the slice.

## Direction — two concurrent roadmaps

Product development and market discovery run in parallel; neither waits for
the other (details and gates in `STRATEGY.md` §14–§23):

- **Roadmap A (product):** P1 Retention & Evidence Foundation → P2 Learner
  Profile + Availability + Minimal School Context → P3 Adaptive 5–10 Minute
  Vocabulary Planner → P4 Rich School Workflow → P5 Error Memory → P6 Shared
  Knowledge/Skill Model → P7 Model-driven practice beyond vocabulary.
- **Roadmap B (market):** G0 interviews + first 20–30 testers (runs alongside
  P1) → G1 activation experiment → G2 repeatable school-network acquisition →
  G3 shareable public tool → G4 content/SEO → G5 school-cluster growth →
  G6 paid experiments only after organic economics are understood.

Every phase carries a product gate and a market gate before expansion. The
roadmap no longer grows by adding English skill modules; new activity types
arrive only when the learner model demonstrably needs them (P7).

## Non-goals

- Textbook cloning or dependence on one publisher's content
- Adult English, TOEIC, IELTS in the near-term plan; speaking in this phase
- Teacher/B2B classroom tooling; LAIO stays student-first
- A general-purpose calendar app
- Microservices or Kubernetes without measured evidence
- AI-controlled scheduling or AI-authored learner state
- Engagement-only gamification, XP farming, punitive daily streaks
- Paid advertising before organic loop economics are understood
- Unimplemented marketing claims ("learn 3× faster")

## Collaboration contract

Every milestone must define its goal, API contract, UI states, acceptance
criteria, tests, and explicit non-goals. Work on one vertical slice at a
time. Do not add adjacent features while a slice is incomplete.
