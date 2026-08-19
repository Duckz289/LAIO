# LAIO Long-Term Product Strategy

Status: strategy of record, adopted 2026-08-18. `PRODUCT.md` summarizes this
document; when the two disagree, this document wins for strategy and
`PRODUCT.md`/`API_CONTRACT.md` win for the current milestone's scope.

Every claim in this document is labeled with its evidence class:

- **[Repo]** — Repository fact, verified in code or migrations.
- **[Ext]** — External evidence with a source.
- **[Inf]** — Inference from facts; reasonable but not directly verified.
- **[Hyp]** — Product hypothesis that requires real users to validate.

The core rule of this strategy: **product development and market discovery must
run concurrently.** This document is structured so it cannot be read as "build
everything first, find users later" — every product phase (P1–P7) is paired
with a market stage (G0–G6), and several product phases are explicitly blocked
on market evidence.

---

## 1. Current-state audit

### 1.1 Evidence table

| Current capability | Actual implementation status | Data already captured | Relevant invariant | Strategic implication |
|---|---|---|---|---|
| Identity | **[Repo]** Supabase JWT only; `get_current_user` returns a bare `user_id` (`backend/app/api/deps.py`). No profile table of any kind exists. | Nothing beyond `user_id`. | Every user-scoped query filters by `user_id`; child resources authorized through parents. | The Learner Profile is a green-field addition. `BACKLOG.md` already anticipated a `UserLearningProfile`. |
| Vocabulary capture | **[Repo]** Real and tested: notebooks + vocab CRUD, server search, bounded pagination. | word, meaning, pronunciation, pos, example, audio/image URLs, `difficulty_level` (1–5). | Notebook ownership; the live schema is expected to create a progress row through `trg_vocab_items_create_progress`; the service has a guarded fallback for environments without that trigger. | Capture works. Any future CEFR field or source needs an approved data and public-contract design. |
| SRS scheduling | **[Repo]** Pure SM-2 function (`backend/app/services/sm2_service.py`); `vocab_progress` is the single persisted schedule per (item, user). | ease_factor, interval_days, repetition_count, next_review_date, last_reviewed_at. | Due-only review (`next_review_date <= CURRENT_DATE`); ease ≥ 1.3; row locking on update. | Deterministic and auditable. The future planner **extends** this; it never replaces or overwrites it. |
| Review evidence | **[Repo]** `review_history` is append-only with before/after schedule snapshots. | score (0–5), review_type, time_spent_ms, ease/interval before+after, next_review_date_after, reviewed_at, session link. | Append-only; unique (session, item); score ≥ 3 = correct. | Good skeleton. Missing: prompt direction, the answer actually submitted, and plan context — the "capture now or lose it" gap (§13). |
| Learning sessions | **[Repo]** Real vertical slice: create → answer → complete/abandon. | planned/answered/correct counters, status, timestamps. | One active session per user (partial unique index); no double-answer per item per session; new session abandons the old active one. | The future Daily Session composes on this infrastructure. No rewrite needed. |
| Analytics | **[Repo]** Counter summary + naive consecutive-day streak (`backend/app/services/analytics_service.py`). | Derived only; nothing persisted. | — | No retention measurement, no weak-item view, no delayed-check concept. P1 material. |
| Vocabulary lookup | **[Repo]** No dictionary lookup route or provider is implemented in this checkout. Frontend lookup/CEFR remnants are tracked as a contract-alignment debt. | None from a lookup provider. | Any future provider must not become a source of truth for ownership, scheduling, or learning history. | A provider abstraction may be appropriate only after an approved feature slice defines data provenance, fallback behavior, and public contract. |
| Game sessions | **[Repo]** Backend mounted; frontend does not call it (legacy). | — | — | Outside this strategy. Candidate for deliberate retirement per `TECH_DEBT.md`. |

### 1.2 Documentation ↔ code reconciliation

The 2026-08-19 documentation audit reconciled the previously reported search
route and PATCH/PUT summaries in `API_CONTRACT.md` and `AI_HANDOFF.md`.

The tracked Alembic migration chain currently ends at `0004`; no tracked
`0005_vocab_cefr_level.py`, backend CEFR field, dictionary lookup route, or
dictionary-provider implementation exists in this checkout. Frontend remnants
that assume lookup/CEFR support remain tracked debt in `TECH_DEBT.md`.

Repository branch and deployment state are transient facts. They are checked at
the start of an implementation run rather than asserted as durable strategy
content.

### 1.3 What remains unchanged

The following are working, proven, and deliberately preserved:

- The vocabulary loop as the foundation and proving ground — not the final
  product boundary. **[Repo]**
- Deterministic SM-2 scheduling and its invariants. **[Repo]**
- `ReviewHistory` as append-only learning evidence. Never destructively
  overwritten, never replaced by derived aggregates. **[Repo]**
- Ownership checks in services, one transaction per request, modular monolith.
  **[Repo]**
- `is_mastered` stays a UI flag; it never removes an item from the SRS queue.
  **[Repo]**

### 1.4 Weaknesses of the previous long-term roadmap

The old `BACKLOG.md` expanded by English skill modules ("Later — all-in-one
skills: listening, reading, grammar, speaking, writing, TOEIC/IELTS
roadmaps"). **[Repo]** That shape has three failures:

1. It measures progress by feature count, not learner outcomes. Each new tab
   would start from zero evidence and dilute the one loop that works. **[Inf]**
2. It converges on being a smaller Duolingo/Quizlet — products that already
   exist, are free, and are better funded. **[Inf]**
3. It contained no distribution plan at all: nothing answered how a learner
   discovers LAIO, why they try it, or why a first session earns a second.
   **[Inf]**

---

## 2. Revised product thesis

> LAIO becomes the persistent learning memory and decision system for a
> Vietnamese secondary/high-school student's English learning. The school
> provides curriculum and context; LAIO provides individual memory, diagnosis,
> prioritization, scheduling, and continuity.

The structural claim (evaluated, then refined):

```
Shared knowledge/curriculum model     (shared across learners — LATE, P6)
  + Learner state                     (per learner: memory, errors, mastery bands)
  + School context                    (grade, book, unit, tests — MINIMAL first)
  + Goal                              (what the learner is working toward)
  + Availability                      (realistic time budget)
  + Forgetting/review state           (SRS schedule + history)
  + Deterministic scheduling policy   (SM-2 + planner rules)
  = Personal daily learning plan
```

**Refinements after pressure-testing:**

- Personalization must emerge from structured state, never from manually
  authored per-student courses. The current schema already proves the pattern:
  every user's schedule diverges from the same SM-2 policy applied to their
  own history. **[Repo]**
- Do **not** build the shared knowledge model first. Formal knowledge tracing
  requires item→skill mappings and large interaction volumes before its
  estimates beat simple heuristics **[Ext]** (Corbett & Anderson 1994, knowledge
  tracing; Piech et al. 2015, deep knowledge tracing). LAIO has neither yet.
  Learner state accumulates on user-owned vocabulary now; the shared concept
  taxonomy arrives at P6 only when error evidence demands it.
- The scheduling core stays deterministic. Retrieval practice and distributed
  practice are among the best-supported techniques in learning science
  **[Ext]** (Roediger & Karpicke 2006; Cepeda et al. 2006; Dunlosky et al.
  2013 rate both as high utility) — LAIO's edge is not a novel algorithm but
  the memory + context + prioritization layer on top of a proven one.

---

## 3. First target segment — a wedge HYPOTHESIS, not a committed fact

### 3.1 Why this is not committed

The largest theoretical pain does not automatically produce the best first
market. Distribution access is a legitimate strategy variable: LAIO's founders
currently have much easier real-world access to THPT students than to
arbitrary Vietnamese students nationally. **[Inf]** At the 0→30 user stage,
the speed of learning from real users dominates theoretical market size.

### 3.2 Exam-context evidence (changed in 2025, affects both candidates)

- **[Ext]** Thi vào lớp 10: under Thông tư 30/2024/TT-BGDĐT (effective
  2025-02-14), the exam is Toán + Ngữ văn + one third subject chosen annually
  by each provincial DoET, with the same subject not repeatable more than
  three consecutive years. English is therefore **no longer a guaranteed**
  entrance-exam subject in any given province/year
  (thuvienphapluat.vn/van-ban/Giao-duc/Thong-tu-30-2024-TT-BGDDT;
  daibieunhandan.vn). A MoET proposal to reduce to Toán + Văn only exists
  (daidoanket.vn) but is not adopted.
- **[Ext]** Thi tốt nghiệp THPT: from 2025 the format is 2 compulsory (Toán,
  Văn) + 2 elective subjects; English is elective. School-level surveys report
  roughly a third of students choosing it, while other reports name foreign
  language the most-chosen elective (thuvienphapluat.vn; tuoitre.vn;
  thanhnien.vn).

Consequence: **exam pressure is real but province- and cohort-dependent for
both candidates.** The universal, recurring anchor is the school unit-test
cadence and the daily vocabulary load of the 2018 curriculum — which is
exactly what the existing loop serves. Exams are amplifiers, not the anchor.

### 3.3 Candidate comparison

Candidate A = Grades 8–9 (THCS). Candidate B = Grades 10–11 (THPT).
Grade 12 is excluded from both: the exam-cram year rewards past-paper drills
and short-horizon tactics, mismatched with a memory system whose value
compounds over months. **[Inf]**

| Dimension | A: Grades 8–9 | B: Grades 10–11 |
|---|---|---|
| Pain intensity | High where English is the province's third subject (thi vào 10); variable otherwise **[Ext]** | Moderate-high: unit tests, GPA for university admission schemes, elective THPT exam **[Inf]** |
| English-learning frequency | High (3–4 school periods/week + tutoring) **[Inf]** | High (similar cadence) **[Inf]** |
| School-test frequency | Regular unit tests + high-stakes year-end **[Inf]** | Regular unit tests, mid-terms/finals **[Inf]** |
| Fit with 5–10 min self-directed product | Weaker: younger students need more external structure **[Hyp]** | Stronger: more self-directed study habits **[Hyp]** |
| Ease of recruiting real testers | Low: founders lack direct THCS networks **[Inf]** | High: founders' own peer/school network **[Inf]** |
| Ability to observe users directly | Low (mediated by parents/teachers) | High (in person, same social circles) |
| Curriculum consistency | Global Success and other MoET-approved series under the 2018 program **[Ext]** | Same program; same publisher plurality **[Ext]** |
| Urgency | Spiky (entrance exam year, where applicable) | Steady (unit tests, GPA) |
| Tutoring / competing workload | Heavy in exam years | Heavy but more self-managed |
| Vocabulary relevance to current product | High | High |
| Weekly repeat-use opportunity | High | High |
| Parent dependence (device, payment, permission) | High — acquisition friction + heavier minor-privacy burden | Lower — more device autonomy |
| Product complexity required | Higher (more scaffolding, parent surface possibly needed) **[Hyp]** | Lower (current product shape is closer) **[Inf]** |
| Likely acquisition channels | Parents, teachers, tutoring centers | Classmates, peer clusters, student communities |
| Dense school/class cluster formation | Possible but founder-remote | Directly reachable through founders' network |

### 3.4 Leading hypothesis and what would overturn it

**[Hyp] Leading hypothesis: Candidate B — Grades 10–11.**

Reasons: (1) recruiting, observing, and forming clusters is an order of
magnitude cheaper through the founders' real network, and at 0→30 users
learning speed is the scarce resource; (2) device and study autonomy fit a
5–10-minute self-directed product; (3) unit-test cadence provides recurring
urgency without depending on province-specific exam policy; (4) the current
product shape (self-capture + review) requires the least modification for
this segment.

**Evidence that would overturn it:**

- G0 interviews show THPT students do not self-capture vocabulary (tutor
  worksheets and photographed notes dominate) or show no return-when-due
  behavior in the 2-week tester window.
- The THCS probe shows dramatically stronger pull (e.g., students or parents
  actively chase the product) while THPT interest is polite indifference.
- THCS clusters prove cheaply reachable after all (younger siblings, tutoring
  centers of the founders' acquaintances).

Until G0 completes, `STRATEGY.md`, `PRODUCT.md`, and all marketing language
treat the wedge as a hypothesis.

---

## 4. Wedge-validation research design (= market stage G0)

Runs alongside product phase P1. Requires no engineering beyond P1.

**Participants:** 8–12 THPT (grades 10–11) interviewees; ~20–30 THPT testers
hand-recruited from the founders' network using the current vocabulary loop
for 2 weeks; a THCS probe of ≥5 interviews (younger siblings, tutoring
contacts) so Candidate A is not dismissed without data.

**Method — behavior over preference.** "Would you use LAIO?" is weak evidence.
Core protocol questions:

- "What did you do the last time you had an English test?"
- "How did you decide what to revise?"
- "What did you do with vocabulary you didn't know?"
- "Which app did you open? What made you stop using it?"
- "Walk me through yesterday: school, tutoring, homework, free time."
- "When was the last time you studied English for less than 15 minutes? What
  did you do?"
- "What result about your own English would you screenshot and send a friend?"

**Tester observation:** watch the first session live where possible; then
usage traces (return-when-due, session completion, capture volume) + a
2-minute weekly diary prompt.

**Outputs:** wedge decision evidence; activation-flow evidence for G1
(where in the first session does perceived value appear?); the first honest
baselines for the GTM metric framework (§22); a validated/falsified
positioning language sample (§ positioning, inside 3.4/20).

---

## 5. Learner Model

What the product must know, before any database design.

### 5.1 Per-item memory state (exists today, reframed)

**[Repo]** SM-2 state + review history already encode a per-item memory
estimate. The Learner Model reframes this as banded, evidence-honest states,
derived deterministically — no new source of truth:

| Band | Deterministic derivation (from existing data) |
|---|---|
| `new` | No reviews yet |
| `learning` | repetition_count low; interval ≤ ~6 days |
| `reviewing` | Growing interval; recent lapses possible |
| `strong` | High repetition count + long interval + no recent lapse |
| `at-risk` | Overdue beyond a threshold, or lapse pattern in recent history |

### 5.2 Evidence Confidence

Every estimate carries `(evidence_count, confidence_band)` where the band is
`insufficient | low | adequate` — derived from how many reviews, how recent,
and across how many activity types. The product must always distinguish "we
estimate mastery is high" from "we barely have enough evidence to know."

**No fake precision.** LAIO does not display "82% mastery." A percentage
implies psychometric calibration the underlying evidence does not have.
**[Inf]** Bands + evidence counts are honest and explainable; probabilistic
models can replace them at P6 only if they measurably outperform.

### 5.3 Profile signals (added over time, minimal first)

| Signal | Phase | Required? | Why the product needs it |
|---|---|---|---|
| Grade | P2 | Yes (only required field) | Curriculum stage; age-appropriate content and privacy posture |
| Goal (unit test, entrance exam, general) | P2 | Optional | Planner relevance weighting; positioning of progress views |
| Weekly time budget + session default | P2 | Optional (defaulted) | Session sizing; §8 |
| Minimal school context (book/unit/test date) | P2 | Optional | §7 |
| Delayed-retention outcomes | P3+ | Automatic | Trust evidence (§11) |
| Error/weakness records | P5 | Automatic | §6 |
| Skill mastery beyond vocabulary | P6/P7 | Automatic | Only when those activities exist |

---

## 6. Error Memory

The signature-capability candidate: LAIO recognizes when multiple mistakes
represent the same underlying weakness, and whether that weakness improves
and stays improved.

**Lifecycle (deterministic):**

```
raw evidence → recurring weakness → improving → recovered (delayed-check verified)
```

**Phased honestly:**

1. **P1 — capture raw evidence.** Extend answer evidence with prompt
   direction (word→meaning vs meaning→word vs listening), the answer the
   learner actually submitted (for typing/multiple-choice), and activity
   kind. Without this, later classification has nothing to classify — this
   is the unrecoverable part. **[Inf]**
2. **P4 — learner-marked errors.** Students record "I got this wrong on the
   test / in homework" with a free-text or picked-from-list note. External
   evidence enters the model with the learner as the source of truth.
3. **P5 — weakness records.** Deterministic grouping first: same item
   repeatedly failed; same tag repeatedly failed (tags from a small curated
   taxonomy, e.g., "present perfect vs past simple with finished-time
   expressions", "word form", "preposition collocation"). Each weakness
   stores evidence links, first/last seen, contexts, and lifecycle state.
   Improvement requires a delayed check, not just one correct answer.
4. **P5+ — AI-assisted classification.** AI may *suggest* which weakness a
   new error belongs to or propose a new tag. Suggestions are confirmable by
   the learner and stored with provenance. **AI is never the source of truth**
   for what the learner got wrong, when, or whether they improved; those are
   recorded facts. A model-provider failure must leave Error Memory fully
   intact and usable. **[Repo-invariant extended]**

**What Error Memory must eventually answer:** what did this learner repeatedly
get wrong; when; in what contexts; is it recurring; has it improved; did it
stay improved after a delayed check.

---

## 7. Minimal School Context vs Rich School Workflow

The strategic promise is stronger when the planner can distinguish "this word
is due" from "this word is due AND belongs to what you're studying at school
this week." Therefore a *minimal* school context arrives early (P2) — and the
heavy workflow stays later (P4).

### 7.1 Minimal School Context (P2)

Only these, all deferrable, all learner-entered:

- grade (the one required profile field)
- curriculum/book (optional; a label like "Global Success 10" — metadata, not
  content)
- current unit/topic (optional; free-text or picked label)
- vocabulary source tag on capture: `school | self-study | other`
- upcoming test date (optional) + rough scope ("Units 4–5")

Cost: a few optional fields + one tag at capture time. Value: the P3 planner
gains a school-relevance signal and a test-urgency signal; without them the
first planner is "SM-2 with a nicer UI." **[Inf]**

### 7.2 Rich School Workflow (P4)

- test-error capture (enter missed questions; feeds Error Memory)
- homework context; unit transitions ("we started Unit 6")
- richer curriculum topic mapping (curated topic lists per book/unit as
  *metadata*)
- importing the learner's own small vocabulary lists
- (later phase, explicitly deferred) uploading own tests/worksheets for
  analysis

### 7.3 Legal/content constraint (both layers)

School/book/unit is **context and mapping, never content ownership**. LAIO
does not copy textbook exercises or reading passages. **[Ext]** Global Success
is published by VEPH with Macmillan/Pearson and is one of several MoET-approved
series (vietnamnews.vn; tandfonline.com) — LAIO must not depend on or
reproduce any single publisher's content. Practice content LAIO ships is
original or licensed.

**Long-term workflow this enables:** school lesson → LAIO captures context →
LAIO identifies what needs reinforcement → student practices → homework/tests
produce new evidence (learner-entered) → learner model updates → next session
changes.

---

## 8. Study Availability

Deliberately smaller than a calendar. The planner needs to know *enough to
schedule learning*, not enough to reconstruct a student's life. **[Privacy]**

**The model (P2):**

- weekly template: which days are usually free vs busy (day-level, no hours)
- default session target: 5 / 10 / 20 minutes
- maximum daily review load (defaulted; user-adjustable)
- "busy today" toggle (temporary, no reason collected)
- optional upcoming test dates (shared with §7)
- implicit signal: "I only have 5 minutes now" = the learner picks the small
  session on the day; no configuration required

**Explicit non-features:** hour-by-hour timetables, tutoring schedule
ingestion, calendar sync, location, notifications tied to inferred free time.
Rejected because invasive relative to value and because coarse inputs already
determine session size and cadence. **[Inf]**

---

## 9. The Adaptive Study Planner (P3)

### 9.1 Decision model — gates, not a formula

The suggested multiplicative formula (`priority = need × forgetting risk ×
school relevance × goal relevance × prerequisite value × urgency`) was
evaluated and **rejected as the implementation**: multiplying six estimated
factors compounds noise, hides reasoning, and cannot be explained to a
learner. **[Inf]** Instead: deterministic lexicographic gates with simple
ordering inside each gate — understandable, debuggable, explainable.

```
Budget: N minutes → capacity C items (measured, not assumed, from the
learner's own median seconds/item; defaulted conservatively at first)

Gate a — DUE:        due reviews, most-at-risk first
                     (longest-overdue × recent-lapse first), capped to C
Gate b — WEAK:       at-risk/weak items not currently due
                     (lapse patterns, low ease)
Gate c — SCHOOL:     current-unit / test-scope items
                     (test-date proximity expands this gate's share)
Gate d — EXPLORE:    new items or low-evidence diagnostic checks
                     (only when budget remains)
```

Rules, not weights: a test within 3 days may promote gate c above gate b
(rule-based swap, logged). Every selection stores a **reason code**
(`overdue_risk`, `recent_lapses`, `current_unit`, `test_in_3_days`,
`low_evidence`) — "Why am I seeing this?" is a lookup, not a generated
rationalization.

### 9.2 Time budgets do not scale linearly

- **5 minutes** — one job: the highest-risk due reviews. Complete unit:
  opening ("8 words are at risk of being forgotten"), the reviews, a closing
  summary ("7 rescued, 1 rescheduled sooner"). Nothing else.
- **10 minutes** — two blocks: due reviews + one focus block (weak-item
  variations, or current-unit reinforcement when a test is near).
- **20 minutes** — three blocks: due + focus + explore (new words or a
  low-evidence diagnostic), still ending with a summary.

A 5-minute session is a complete, valuable unit — never an interrupted
fragment of a 30-minute lesson.

### 9.3 Return after absence

The database stays honest: overdue is overdue, `review_history` untouched.
The planner redistributes: cap today's load at the learner's max, order by
forgetting risk, spread the remainder forward, and say so plainly ("120
overdue — today's 15 most at risk first; the rest are scheduled across the
week"). No destructive rescheduling, no guilt wall. **[Repo-invariant
extended]**

### 9.4 Why this beats "SM-2 with a nicer UI"

Same evidence base, but selection reflects time budget + school relevance +
risk ordering + absence redistribution, and every choice explains itself.
Two students in the same class with identical notebooks receive materially
different sessions because their histories, availability, and test scopes
differ. MVP stays fully deterministic; ML enters only if a gate at P6 proves
it outperforms these rules on the same data. **[Hyp to be tested at P3's
gate]**

---

## 10. Retention system (layered, in priority order)

1. **Utility retention** — LAIO genuinely has useful work due. The SRS loop
   already generates this **[Repo]**; P1 makes "return when due" visible and
   easy (due preview, one-tap start).
2. **School-workflow retention** — LAIO fits around lessons, homework, and
   tests (unit relevance, test countdown, post-test error capture). **[Hyp]**
3. **Accumulated-memory retention** — switching costs from history: "LAIO has
   14 weeks of your learning memory." The moat and the reason LAIO gets
   better with use. **[Inf]**
4. **Competence/progress retention** — credible evidence of improvement:
   weak → recovered lists, 7/30-day retention checks (§11). **[Hyp]**
5. **Habit retention** — lightweight and honest: weekly flexible consistency
   goal (e.g., any 4 of 7 days) instead of fragile daily streaks; a missed
   day never destroys months of visible progress. The existing daily streak
   **[Repo]** remains but is demoted from the primary motivator. Achievements
   attach to learning outcomes (recovered weaknesses, retention milestones),
   never to raw activity volume. No XP farming.

---

## 11. Trust and learning-evidence system

Why should a student believe LAIO improves their English? Through evidence,
not claims:

- **Delayed retention checks** — scheduled re-tests at ~7/30 days after
  apparent mastery, reported honestly ("of 40 words learned in June, you
  still knew 31 after a month").
- **Unseen transfer questions** (P5+) — a weakness counts as *recovered* only
  when passed in a variation the learner hasn't seen.
- **Before/after views** — weak → recovered lists with dates and evidence
  links.
- **"Why this activity?"** — reason codes surfaced in-session (§9).
- **Confidence honesty** — estimates display their evidence band (§5.2);
  "not enough evidence yet" is a legitimate, visible state.
- **Source attribution** — any future dictionary, IPA, audio, or CEFR data
  must show its source class and use an approved boundary that does not expose
  provider secrets or make provider output authoritative. **[Future design]**
- **User correction** — learners can fix LAIO's assumptions (unit, goal,
  "I actually know this word") and corrections are recorded as evidence, not
  silently discarded.

**Three retentions, never conflated:** product retention (do they return),
learning retention (do they remember — delayed checks), workflow retention
(is LAIO part of school life — context reuse, test flows). No "learn 3×
faster" claims: no defensible measurement design exists for that today;
§22 defines baseline experiments first.

---

## 12. Role of AI vs deterministic systems

| Concern | Owner | Rationale |
|---|---|---|
| Scheduling (SM-2, planner gates) | Deterministic | Auditable, explainable, cheap, provider-independent **[Repo]** |
| Mastery/weakness state | Deterministic derivation from recorded evidence | Source-of-truth integrity |
| Ownership, history, session invariants | Deterministic + DB constraints | Already enforced **[Repo]** |
| Explaining a mistake | AI (later) | High value, low risk — output is advisory prose |
| Controlled exercise variations, example sentences | AI (later, reviewed patterns) | Content leverage without a content team |
| Error classification | AI *suggests*, learner/rules confirm | §6 |
| Adapting explanation level | AI (later) | Uses profile as input, writes nothing authoritative |

Constraints: structured learner state, review history, goals, ownership, and
scheduling decisions remain auditable; a model-provider failure must not
erase or invalidate learner state; no architecture coupling to one
proprietary model — every AI touchpoint goes through a provider-agnostic
provider-agnostic adapter. **[Architecture direction]**

---

## 13. Data to capture early

The question: what becomes expensive or impossible to reconstruct later?

**A — already captured adequately [Repo]:** per-review before/after schedule
snapshots; score/review_type/time_spent_ms; session counters and status;
schedule state; capture timestamps.

**B — start capturing soon (P1–P2), cheap now, unrecoverable later:**

- prompt direction and activity mode per answer (beyond coarse `review_type`)
- the submitted answer itself for typing/multiple-choice (what wrong option —
  Error Memory's raw material)
- session origin (daily-plan vs manual) and the session's planned time budget
- planner selection snapshot + reason codes once P3 exists (needed to ever
  evaluate the planner against a baseline)
- minimal profile fields and school-context fields (§5.3, §7.1)
- market-learning events (§22): acquisition source, onboarding path,
  activation event, share events

**C — useful only much later (do not build yet):** curriculum topic
taxonomies per book/unit; delayed-check outcomes at scale; skill-level
mastery beyond vocabulary; cross-learner difficulty statistics.

**D — do NOT collect (complexity/privacy risk exceeds value):** school name,
teacher names, class rosters, hour-level timetables, location, contacts,
device surveillance, keystroke/attention analytics, any classmate-comparison
data without explicit consent.

Rule for every field and event: it must answer a named product or market
decision. No decision attached → not collected.

---

## 14. Roadmap A — product/learning system

Vertical slices; each phase has dual gates in §23.

- **P0 — Vocabulary foundation.** Done. **[Repo]** capture → review →
  remember → return, with honest schedule state.
- **P1 — Retention & Evidence Foundation.** Make the existing loop easy to
  return to and honest to measure: return-when-due surface, absence-safe
  review entry (§9.3 behavior in its simplest form), extended evidence
  capture (§13-B), weekly consistency view, delayed-check groundwork.
  *Protected: this stays first because evidence not captured now cannot be
  reconstructed.*
- **P2 — Learner Profile + Availability + Minimal School Context.** §5.3,
  §7.1, §8. All fields optional except grade; onboarding friction near zero.
- **P3 — Adaptive 5–10 Minute Vocabulary Planner.** §9. Home becomes "what's
  worth doing today," with reason codes.
- **P4 — Rich School Workflow.** §7.2. *Blocked on G0/G1 evidence that
  students value school-linked planning; shrinks if they don't.*
- **P5 — Error Memory.** §6 weakness records + delayed verification.
- **P6 — Shared Knowledge/Skill Model.** Concept taxonomy + relationships,
  only when P5 evidence demands it and simple heuristics demonstrably cap out.
- **P7 — Model-driven practice beyond vocabulary.** Grammar/reading
  micro-activities introduced because the learner model identifies needs it
  cannot serve with vocabulary alone — never because the roadmap wants
  another tab. Speaking remains out of scope for this strategy phase.

Ordering note: P4 precedes P5 because learner-entered test errors (P4) feed
Error Memory (P5) its richest raw material; the dependency rule above can
reorder them if market evidence says school workflow is not valued.

---

## 15. Roadmap B — user/market (concurrent with Roadmap A)

- **G0 — Student interviews + first 20–30 testers.** §4. Runs alongside P1.
- **G1 — Activation experiment.** §17. Define and measure the Aha moment on
  the current loop + P1 improvements.
- **G2 — Repeatable school-network acquisition.** Clusters of 2–5 friends
  through existing testers; measure invitation→activation inside clusters.
- **G3 — Shareable public tool/diagnostic.** §18/§21. Original content only;
  value before signup.
- **G4 — Content + SEO experiments.** §20/§21.
- **G5 — School-cluster growth.** §19 at scale.
- **G6 — Paid acquisition experiments.** Only after organic loop economics
  are understood. No paid-ads dependency before this.

**Cross-roadmap dependencies (binding):**

- P4 rich school workflow is not built if G0/G1 show indifference to
  school-linked planning.
- Viral/class features are not built if no organic sharing behavior appears
  in G2/G3.
- Distribution does not wait for the product roadmap: G0 starts with P1.

---

## 16. Acquisition strategy by stage

**0 → 30 users — goal: learning, not scale.** Hand-recruited from the
founders' THPT network: classmates, nearby classes, tutoring peers, student
communities the founders already belong to. The invitation is a job, not a
favor — not "please test my app" but an offer in the family of: *"Bạn có 10
phút? LAIO chọn phần tiếng Anh đáng ôn nhất cho bạn hôm nay — và nhớ giùm bạn
những gì bạn hay quên."* **[Hyp — wording must be tested in G0, not assumed.]**
What the first 30 must teach the team: do students self-capture vocabulary;
do they return when reviews are due; does a 5-minute session feel complete;
what result would they voluntarily share; where does perceived value first
appear in the first session.

**30 → 100 — goal: one repeatable motion.** Cluster expansion through
existing testers (§19) plus the first shareable artifact (§18). Measure:
invitations sent voluntarily, recipient open rate, recipient activation.
Stop-rule: if no motion repeats without founder hand-holding, return to
positioning/activation before growing further.

**100 → 1,000 — goal: channel economics.** Content and public tools (§20,
§21) with tracked source → activation → retention funnels per channel.
Paid experiments remain gated behind G6.

---

## 17. Activation design

**Activation is NOT** account created, notebook created, or dashboard
visited.

**Aha hypothesis [Hyp]:** *"LAIO noticed something about my learning that
feels correct and gave me a useful next action."* Operationalized activation
event: **first completed 5-minute session that surfaces at least one at-risk
or forgotten word the learner recognizes as genuinely shaky** — measurable
(completion + the item had lapse/overdue evidence), and testable in G0 by
observation.

**Two candidate flows evaluated:**

1. *Diagnostic-led:* public mini-check → personalized result → first 5-minute
   activity → save progress → account. Stronger first impression, but
   requires diagnostic content and infrastructure that do not exist yet.
   **Deferred to G3.**
2. *Capture-led:* sign in → manually capture a handful of words → first
   review with visible scheduling ("LAIO will ask you this again Thursday") →
   due reviews return. Fits current product maturity. **Chosen for G1.**

**Defined:** activation event (above); time-to-value target — measured
first, then reduced (baseline from G0, no invented number); minimum
information before first value — essentially none beyond a few captured
words (grade can wait until after the first session); deferred information —
profile, availability, school context are post-value prompts, never signup
walls.

---

## 18. Product-led growth loops

Mechanism candidates, scored on: why a student voluntarily shares / why the
recipient cares / privacy controls / genuine learning value / works without a
large network:

| Artifact | Verdict |
|---|---|
| **Shared study pack** (a vocab set, e.g., "Unit 5 — the 20 words I keep forgetting") | **Strongest near-term [Hyp]**: works at 2–5 friends, useful before signup (recipient can view/practice once without an account), naturally school-clustered, zero privacy risk if the sharer opts in per pack |
| Unit readiness check | Strong but needs original content — arrives with G3 |
| Weekly learning recap / retention report | Retention aid first; shareable only if the learner is proud of it — opt-in |
| Weak → recovered card | Emotionally strong, small; opt-in share |
| Class/unit challenge | Deferred until organic sharing is observed (cross-roadmap rule) |
| "Invite 5 friends for gems" | **Rejected** — no product reason; farms low-quality users |

**Loop:** student gets a useful result → voluntarily shares the artifact →
friend gets value *before* signing up → friend tries LAIO → friend receives
their own personalized result → activation. Privacy: aggregate or self-chosen
artifacts only; no classmate comparisons without explicit consent from both
sides; share is always opt-in per artifact.

---

## 19. School-cluster growth hypothesis

One isolated user is expensive to acquire repeatedly; several students in the
same class studying the same unit have naturally correlated needs. **[Inf]**

**Loop [Hyp]:** one student uses LAIO for Unit X → shares a Unit-X study pack
or (later) readiness check → 2–5 classmates try it → a small cluster forms →
LAIO gets denser, comparable feedback from similar learners → the planner's
school-relevance features improve for the whole cluster.

What must work at 2–5 friends before any classroom scale: sharing a pack,
practicing a shared pack without an account once, and a visible reason for
the recipient to create their own memory ("LAIO can remember which of these
20 words *you* forget"). Explicitly out: teacher dashboards, class
management, school sales. This remains student-first; B2B is a non-goal
(§26).

---

## 20. Content strategy

Pain-first, never app-promotion. "AI-powered personalized English-learning
ecosystem" is assumed undifferentiated **[Inf]** — competitors already claim
every word of it.

**Formats to test (short-form, in Vietnamese):** common school-English
mistakes; "Can you answer this Grade 10 question?"; word-form traps; "Why is
this answer wrong?"; mini unit readiness checks; learning experiments run in
public ("we tested whether 5-minute sessions beat 20-minute cramming —
here's our data"); founder-story build-in-public — a student building a study
tool for students. The founder story is treated as a **hypothesis** to be
A/B-observed against plain pain-first content, not as automatic authenticity.

**Binding rule:** every content piece routes to a product action —
content → interactive check → useful result → first LAIO session. Never
content → generic landing page → signup form.

**Positioning (primary hypothesis + falsifier).** Not positioned on AI /
all-in-one / personalized learning / gamification. Directions generated and
evaluated on clarity, differentiation, relevance, provability,
one-sentence-ness, and moat connection. **[Hyp] Primary:** the
time-scarcity + memory job — in the family of *"You have limited time. LAIO
decides what English is most worth studying next"* / *"LAIO remembers what
you learn, forget and get wrong — then gives you the most useful 5–10
minutes."* Exact wording is drafted and tested in G0/G1. **Falsifier:** if G0
shows students don't experience "deciding what to study" as a felt pain
(because teacher/tutor instructions decide for them), positioning shifts to
test/unit-readiness framing ("be ready for Friday's test in 10 minutes a
day").

---

## 21. SEO and public tools

Eventually: public, indexable, genuinely-useful-without-signup tools —
original unit concept checks, vocabulary practice from LAIO-owned/original
content, grammar diagnostics, review/forgetting calculators, school-English
explanations. No copyrighted textbook content, ever (§7.3).

Two jobs per tool: (1) useful standalone, no account; (2) a natural bridge to
the moat — the transition is *"save this learning state and let LAIO
remember it over time"*, which is structurally stronger than "create an
account to unlock your result." A tool that cannot make that bridge is
content marketing, not product, and is deprioritized.

---

## 22. GTM metrics and market-learning telemetry

Framework — separated funnels, no invented targets; G0/G1 establish
baselines first:

- **Acquisition:** visitors, source, public-tool usage, diagnostic starts.
- **Activation:** first meaningful learning result; first completed session;
  time-to-value; signup-after-value rate.
- **Retention (product):** D1/D7/D30 where meaningful; sessions per active
  learner; **return-when-due rate** (the loop's native metric); weekly
  consistency.
- **Learning:** delayed retention (7/30-day checks); weak → recovered counts;
  performance on unseen/transfer items (P5+).
- **Workflow:** school-context reuse; current-unit updates; test-related
  usage; new vocabulary captured per week.
- **Viral/PLG:** share rate; recipient open rate; recipient activation;
  cluster formation (≥2 activated users from one school/class source).

**Market-learning events to capture (extends §13-B):** acquisition source,
onboarding path, first job attempted, activation event, session-selection
reason shown, session completion, voluntary share event, recipient
activation, return-when-due, school-context usage. Same binding rule: every
event answers a named decision; no surveillance analytics; events are
aggregate/behavioral, never content-of-communication.

**Failure-mode interpretations (explicit, reused in §23):**

- Learning improves, retention doesn't → UX / motivation / positioning
  problem, not a learning-science problem.
- Retention improves, learning doesn't → dangerous gamification or weak
  educational value; stop and fix before growing.
- Acquisition succeeds, activation fails → marketing promise stronger than
  product; fix product or honesty of promise.
- Activation succeeds, D7 collapses → first-session novelty without ongoing
  utility; the due-loop or planner isn't pulling.

---

## 23. Stage gates — every phase has a product gate AND a market gate

No arbitrary percentage targets: where a number cannot be justified, the gate
defines the baseline experiment instead. "Minimum evidence" = smallest
sample/duration on which the team is willing to decide.

| Phase | Product/Learning gate | Market/User gate | If it fails → do NOT build |
|---|---|---|---|
| **P1** Retention & Evidence | Hypothesis: users return when reviews are due and absence isn't punishing. Metric: return-when-due rate; post-absence continuation. Min evidence: G0's 20–30 testers × 2 weeks. | Hypothesis: the invitation job (§16) recruits real testers who complete a first session. Metric: invited→first-session-completed. | Planner (P3) on top of a loop nobody returns to; fix the loop or the segment first. |
| **P2** Profile + Availability + Minimal School Context | Optional fields get filled without hurting onboarding completion; time-budget selection matches actual session lengths. | Interviewees say the school-context fields describe their real study life (not "why are you asking this"). | School-relevance planner input (part of P3-c); availability-driven sizing stays default-only. |
| **P3** Adaptive Planner | Complete 5–10-min sessions under real budgets: completion rate vs pre-planner sessions; learning (delayed retention) not worse than plain due-queue. Baseline: pre-P3 session completion + retention from P1 data. | Users understand "why am I seeing this" (can restate it in interviews) and voluntarily return to the planner over the manual queue. | P4 school workflow; revisit whether gates a–d order matches user intuition. |
| **P4** Rich School Workflow | Entered test errors and unit updates measurably change plans (school-relevance selections used, not skipped). | Weekly return behavior improves in weeks containing a school test vs baseline; students actually enter post-test errors. | P5 error-classification depth; keep only unit tagging. |
| **P5** Error Memory | Weakness records are deterministic, auditable, and recover only via delayed checks. | Learners recognize the surfaced weaknesses as true ("yes, I always mess that up") and act on them. | P6 shared knowledge model; keep flat per-item tracking. |
| **P6** Knowledge/Skill Model | The shared model's recommendations beat the flat heuristics on the same historical data (offline comparison first). | Personalization visibly outperforms a reasonable non-personalized baseline for users (A/B on session ordering). | P7 expansion; heuristics stay. |
| **P7** Beyond vocabulary | Each new activity type traces to a learner-model need it serves. | The activity is used inside daily sessions, not as an abandoned tab. | Any further activity types. |

Market stages gate similarly: G2 does not scale until G1's activation event
fires reliably; G3's public tool is not built until G2 shows organic sharing
willingness; G6 paid spend waits for organic loop economics.

---

## 24. Privacy and student safety

The audience includes minors. Data minimization is a design constraint, not a
compliance afterthought.

- Collect the minimum §5.3/§7.1/§8 fields; **only grade is required**; every
  other personal field is optional and individually justified in §5.3.
- Coarse availability (day-level) over timetable tracking — deliberately
  §8-shaped.
- §13-D list is binding: no school name, teacher identity, rosters, location,
  contacts, or behavioral surveillance.
- Sharing artifacts (§18) are opt-in per artifact; no classmate comparison
  without consent from both sides.
- Telemetry (§22) is behavioral/aggregate, answers named decisions, and never
  includes content of a learner's private notes beyond what the feature
  itself requires.
- Account deletion removes learner state; ReviewHistory's append-only rule is
  about product writes, not a data-retention exemption.
- Parent-facing consent posture must be resolved before any THCS (Candidate
  A) expansion; this is one reason the THPT-first hypothesis also lowers
  near-term privacy risk. **[Inf]**

---

## 25. Major risks

**Product:** the planner may be perceived as "just flashcards with reasons"
if gates a–d don't produce visibly different sessions (mitigation: P3 market
gate); school-context indifference would remove a differentiation pillar
(mitigation: G0 tests it before P2 builds it).

**Engineering:** evidence-capture extensions touch the hot review path —
schema additions must stay additive and invariant-preserving (mitigation:
P1 is deliberately small; any future persistence changes must be additive,
owner-approved, and invariant-preserving); planner complexity creep (mitigation:
gates are rules with logged reasons, no ML in MVP).

**Market:** founder-network sampling bias — the first 30 THPT users are not
representative of Vietnam (mitigation: THCS probe + stated falsifiers);
free-and-huge competitors (Duolingo generic engagement, Quizlet shared sets,
MochiMochi pre-made SRS packs **[Ext]** mochidemy.com; edtechagency.net) —
LAIO's difference is personal memory + school context, not content volume;
if students only want pre-made packs, the thesis itself is challenged (that
is a G0 question, asked directly).

**Content/legal:** curriculum mapping must never drift into copying
textbook content (§7.3 constraint; reviews at each P4 slice); CEFR labeling
needs a licensed/attributable source before it stops returning null
**[Repo]**.

**Privacy:** minors + shared artifacts + telemetry require the §24 posture
from day one; retrofitting privacy is far more expensive than building with
it.

**Cost:** AI features are deferred until phases where their value is proven;
all AI passes through provider adapters so cost/provider can be swapped;
the deterministic core keeps the product fully functional with AI off.

---

## 26. Explicit non-goals

- Becoming "Global Success online," a textbook clone, or any publisher's
  content mirror
- A generic LMS, another Quizlet clone, or a smaller Duolingo
- Adult English, TOEIC, IELTS in the near-term plan
- Speaking practice (this strategy phase)
- Teacher/B2B classroom tooling (student-first; §19 boundary)
- A general-purpose calendar or timetable app
- Microservices, Kubernetes, event buses, or distributed infrastructure
  without measured evidence (`BACKLOG.md` scale gates stand)
- AI-controlled scheduling or AI-authored learner state
- XP farming, engagement-only gamification, fragile daily-streak punishment
- Paid advertising as an acquisition strategy before G6
- Collecting any §13-D data

---

## 27. Open questions that require real students

Carried into G0's protocol (§4):

1. Do THPT students self-capture vocabulary at all, or do tutor
   worksheets/photos fill that role? (Existence question for the wedge.)
2. Where in the first session does perceived value appear — capture, first
   review, or the "come back Thursday" moment?
3. Is "deciding what to study" a felt pain, or do teachers/tutors decide?
   (Positioning falsifier.)
4. What would a student voluntarily share with a classmate — a study pack, a
   score, a weakness card, nothing?
5. How much time do students actually have between school, tutoring, and
   homework — and when? (Calibrates §8 defaults.)
6. Do students trust an app's claim that they are forgetting something?
   What proof convinces them?
7. Will students enter their test mistakes after a test, even minimally?
   (P4's existence question.)
8. Does the THCS probe reveal pull strong enough to overturn the THPT-first
   hypothesis?
9. What do students who quit MochiMochi/Quizlet/Duolingo say made them stop?
   **[Ext-informed]**
10. Are parents a required stakeholder for THPT-age payment/permission, or
    only for THCS?

---

## Appendix — three example learners (scenario tests, not evidence)

These personas illustrate how the same-day 5–10 minute session differs across
learners. They are constructed scenarios for design pressure-testing; no
research findings are claimed for them.

**Minh — Grade 10, tutoring Mon/Wed/Fri evenings, ~10 free minutes on
tutoring days.** Availability: busy-day template marks Mon/Wed/Fri as
5-minute days. Today (Wednesday): Gate a only — 9 due words, most-at-risk
first, of which 3 are recent lapses. Session opens "9 words are at risk
today," ends "8 rescued, 1 rescheduled to Friday." Reason codes: `overdue_risk`,
`recent_lapses`. No new material is offered on a 5-minute day.

**Lan — Grade 9, provincial thi vào 10 includes English this year, test in
12 days, 20-minute sessions on weekends.** (THCS scenario — served today only
if the wedge evidence brings Candidate A in.) Saturday session: Gate a due
reviews (7 items) → Gate c expands because of test proximity: Units 6–8 scope
words with weak bands (8 items) → Gate d closes with a 3-item low-evidence
check on scope words LAIO barely knows about. Reasons shown: `test_in_12_days`,
`current_unit`, `low_evidence`. Her plan diverges from a classmate's with the
same notebook because her lapse history concentrates in Unit 7.

**Tuấn — Grade 11, strong vocabulary (long intervals, few lapses), weak
grammar/reading, 10 minutes most days.** Today: Gate a is small (2 due
words — his intervals are long), so the planner fills from Gate b: word-form
and collocation items that his error evidence flags (P5+; before P5, his
weak-item gate uses lapse patterns only) → one delayed retention check on a
word "mastered" 30 days ago. Reasons: `delayed_check`, `recent_lapses`. Under
P7, his sessions would begin drawing grammar micro-activities because his
learner model — not a feature tab — demands them; until then LAIO honestly
shows "vocabulary is strong; LAIO doesn't yet have enough evidence about your
grammar."

Same class, same day, materially different sessions — driven by state, not by
manually authored courses.

---

## External sources referenced

- Thông tư 30/2024/TT-BGDĐT (thi vào 10 regulation):
  https://thuvienphapluat.vn/van-ban/Giao-duc/Thong-tu-30-2024-TT-BGDDT-Quy-che-tuyen-sinh-trung-hoc-co-so-va-tuyen-sinh-trung-hoc-pho-thong-628767.aspx ;
  https://daibieunhandan.vn/thong-tu-30-tuyen-sinh-lop-10-khong-lap-lai-mot-mon-thi-qua-3-nam-lien-tiep-10356591.html ;
  proposal coverage: https://daidoanket.vn/bo-gddt-de-xuat-thi-vao-lop-10-chi-gom-toan-va-ngu-van.html
- THPT graduation exam 2+2 format, English elective:
  https://xaydungchinhsach.chinhphu.vn/cong-bo-phuong-an-thi-tot-nghiep-thpt-tu-nam-2025-119231129112222933.htm ;
  https://thuvienphapluat.vn/cong-dong-dan-luat/thi-tot-nghiep-thpt-2025-tieng-anh-khong-con-la-mon-bat-buoc-216756.html ;
  https://tuoitre.vn/thi-tot-nghiep-thpt-2025-mon-tieng-anh-duoc-chon-nhieu-20250111074421465.htm
- Global Success publisher/adoption context:
  https://vietnamnews.vn/society/1729529/viet-nam-education-publishing-house-pioneers-digital-transformation-in-foreign-language-teaching.html ;
  https://www.tandfonline.com/doi/full/10.1080/2331186X.2024.2425898
- Vietnamese EdTech / English-app landscape:
  https://edtechagency.net/edtech-in-vietnam-the-english-learning-segment/ ;
  https://mochidemy.com/tienganh/ (MochiVocab/MochiMochi)
- Learning science: Roediger & Karpicke (2006), testing effect; Cepeda et
  al. (2006), distributed practice meta-analysis; Dunlosky et al. (2013),
  technique utility review; Corbett & Anderson (1994) and Piech et al.
  (2015), knowledge tracing prerequisites.
