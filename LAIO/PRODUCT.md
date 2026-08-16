# LAIO Product Direction

## Product promise

LAIO gives each learner one coherent place to improve English. The first
product loop is:

> sign in → create a notebook → add vocabulary → complete a personalized
> review session → see measurable progress

## Current milestone

The basic vocabulary demo vertical slice is implemented. Its acceptance flow is:
register/sign in → create a notebook → add/edit/search vocabulary → review due
flashcards → see updated due counts and accuracy → sign out. Vocabulary,
scheduling, sessions, and analytics use real user-scoped data; loading, empty,
retry, validation, and authentication failure states are part of the slice.

## Non-goals for this milestone

- Microservices or Kubernetes
- AI-controlled scheduling
- Unimplemented marketing claims
- Speaking, writing, grammar, and exam-roadmap features

These capabilities remain future modules and must reuse the shared learning
session and activity result model.

## Collaboration contract

Every milestone must define its goal, API contract, UI states, acceptance
criteria, tests, and explicit non-goals. Work on one vertical slice at a time.
Do not add adjacent features while a slice is incomplete.
