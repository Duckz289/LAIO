# LAIO API Contract

Base URL: `/api/v1`

All product endpoints require `Authorization: Bearer <Supabase access token>`.
Errors use FastAPI's `{ "detail": ... }` shape. Collection requests are bounded.
Rate-limited requests return `429` with `Retry-After`.

This document describes the public HTTP surface currently implemented. A new or
changed method, path, request field, response field, or status code must be
recorded here before its code changes.

## Notebooks

- `GET /notebooks/`
- `POST /notebooks/`
- `GET /notebooks/{notebook_id}`
- `PATCH /notebooks/{notebook_id}` (`PUT` remains deprecated compatibility)
- `DELETE /notebooks/{notebook_id}`

Notebook list requests accept `limit` (1–200) and `offset` (>= 0), and return
pagination metadata. Notebook responses include database-backed aggregate
fields `vocab_count`, `mastered_count`, and `due_count`. `due_count` follows the
SRS schedule in `vocab_progress`; `is_mastered` remains an independent UI flag.

## Vocabulary

- `GET /vocab-items/notebook/{notebook_id}`
- `GET /vocab-items/notebook/{notebook_id}/search?q={query}`
- `POST /vocab-items/?notebook_id={notebook_id}`
- `GET /vocab-items/{vocab_id}`
- `PATCH /vocab-items/{vocab_id}` (`PUT` remains deprecated compatibility)
- `DELETE /vocab-items/{vocab_id}`

Vocabulary list requests accept `limit` (1–200) and `offset` (>= 0), and return
`VocabItemListResponse` pagination metadata. Vocabulary responses include
optional schedule fields `next_review_date`, `repetition_count`,
`interval_days`, and `ease_factor`.

### Vocabulary search

`GET /vocab-items/notebook/{notebook_id}/search?q={query}`

Searches vocabulary owned by the caller within one owned notebook. `q` is
required and must contain 1–500 characters. It accepts `limit` (default 100,
1–200) and `offset` (>= 0), and returns `VocabItemListResponse` using the same
vocabulary and schedule-field shape as the notebook vocabulary list.

The route returns `404` when the notebook does not exist or is not owned by the
caller. It does not expose vocabulary from another learner’s notebook.

### Vocabulary audio

`POST /vocab-items/{vocab_id}/audio`

Generates and returns an `audio/mpeg` stream for the vocabulary word using Vbee
Realtime TTS. The endpoint is intended for short text such as a single
vocabulary word; audio caching, if any, is a browser concern.

The endpoint returns `404` when the vocabulary is unavailable to the caller,
`503` when Vbee is not configured, and `502` when Vbee cannot generate audio.
The Vbee token is server-side only and is never exposed to the frontend.

## Learning

### `POST /learning-sessions`

Request:

```json
{ "notebook_id": "uuid-or-null", "limit": 20, "skill_type": "vocabulary" }
```

`limit` defaults to 20 and must be 1–50. Creates a session scoped to the
caller and optional notebook. Its planned-item count is bounded by currently
due work and the requested limit. If no work is due, the existing service
returns a completed zero-item session rather than a false active session.

### `POST /learning-sessions/{session_id}/answers`

Request:

```json
{
  "vocab_item_id": "uuid",
  "score": 0,
  "review_type": "flashcard",
  "time_spent_ms": 1200
}
```

Valid scores are 0–5. A score of at least 3 counts as correct. The answer must
belong to the caller’s session and owned vocabulary, be due, and not duplicate a
previous answer for that vocabulary in the same session. The response contains
the updated review schedule.

### `POST /learning-sessions/{session_id}/complete`

Completes an active session and returns final counters and accuracy.

### `POST /learning-sessions/{session_id}/abandon`

Closes an interrupted active session without changing submitted answers.
Starting a new session also abandons any older active session owned by the same
user.

## Reviews and analytics

### `GET /reviews/due?limit=20&notebook_id={optional_uuid}`

Returns due items owned by the caller. `limit` defaults to 20 and must be 1–50.
The response includes a full due `total`, which is not truncated by the bounded
`items` list. Current ordering is next-review date ascending and then vocabulary
creation time ascending.

### `GET /progress/summary`

Returns `total_notebooks`, `total_vocabulary`, `due_today`, review counters,
`accuracy_percentage`, and `current_streak_days`.

The former standalone review-submission API is not part of the public contract;
answers are submitted through a learning session.

## Legacy game sessions

Game-session routes remain mounted in the backend but are outside the core
product navigation. They are not a current roadmap surface; see `TECH_DEBT.md`
before changing or retiring them in a deliberate breaking release.
