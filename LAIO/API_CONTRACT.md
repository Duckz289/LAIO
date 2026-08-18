# LAIO API Contract

Base URL: `/api/v1`

All product endpoints require `Authorization: Bearer <Supabase access token>`.
Errors use FastAPI's `{ "detail": ... }` shape.
Collection requests are bounded. Notebook and vocabulary lists accept
`limit` (1–200) and `offset` (>= 0), and return `total`, `limit`, and `offset`.
Rate-limited requests return `429` with `Retry-After`.

## Vocabulary

- `GET /notebooks/`
- `POST /notebooks/`
- `GET /notebooks/{notebook_id}`
- `PATCH /notebooks/{notebook_id}` (`PUT` remains deprecated compatibility)
- `DELETE /notebooks/{notebook_id}`
- `GET /vocab-items/notebook/{notebook_id}`
- `POST /vocab-items/?notebook_id={notebook_id}`
- `GET /vocab-items/{vocab_id}`
- `PATCH /vocab-items/{vocab_id}` (`PUT` remains deprecated compatibility)
- `DELETE /vocab-items/{vocab_id}`

Notebook responses include the database-backed aggregate fields `vocab_count`,
`mastered_count`, and `due_count`. `due_count` follows the SRS schedule in
`vocab_progress`; `is_mastered` remains an independent UI flag.

Vocabulary responses include optional schedule fields:
`next_review_date`, `repetition_count`, `interval_days`, and `ease_factor`.

Vocabulary requests and responses also include `cefr_level`
(`A1`–`C2` or `null`), additive alongside the existing `difficulty_level`
(1–5). The two are unrelated: `difficulty_level` has no bearing on SRS
scheduling, and `cefr_level` is not consumed by it either.

### Vocabulary lookup

`GET /vocab-items/lookup?term={term}`

Looks up dictionary metadata for a word or short phrase to speed up manual
vocabulary entry. `term` is required, 1–200 characters. The response is
normalized application data only — it never exposes which external
dictionary provider was used:

```json
{
  "term": "abandon",
  "ipa": "/əˈbændən/",
  "audio_url": "https://...",
  "cefr": null,
  "status": "found"
}
```

`status` is one of `found`, `not_found`, or `unavailable`. `ipa`,
`audio_url`, and `cefr` are `null` whenever that data isn't available —
`cefr` is currently always `null` because no CEFR data source is wired in
yet. A `not_found` or `unavailable` status is not an error; the frontend
must still allow manual vocabulary creation. This endpoint never fails the
request because of the external provider; provider outages surface only as
`status: "unavailable"`.

### Vocabulary audio

`POST /vocab-items/{vocab_id}/audio`

Generates and returns an `audio/mpeg` stream for the vocabulary word using
Vbee Realtime TTS. The endpoint is intended for short text such as a single
vocabulary word; audio is cached by the active browser session.

The endpoint returns `503` when Vbee is not configured and `502` when Vbee
cannot generate audio. The Vbee token is server-side only and is never exposed
to the frontend.

## Learning

### `POST /learning-sessions`

Request:

```json
{ "notebook_id": "uuid-or-null", "limit": 20, "skill_type": "vocabulary" }
```

Creates an active session and returns its counters.

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

Valid scores are 0–5. A score of at least 3 counts as correct. The response
contains the updated review schedule.

### `POST /learning-sessions/{session_id}/complete`

Completes an active session and returns final counters and accuracy.

### `POST /learning-sessions/{session_id}/abandon`

Closes an interrupted active session without changing its submitted answers.
Starting a new session also abandons any older active session owned by the same
user.

## Reviews and analytics

- `GET /reviews/due?limit=20&notebook_id={optional_uuid}`
- `GET /progress/summary`

The progress summary returns `total_notebooks`, `total_vocabulary`,
`due_today`, review counters, `accuracy_percentage`, and
`current_streak_days`.

The former standalone review submission API is not part of the public contract;
answers are submitted through a learning session.
