# LAIO API Contract

Base URL: `/api/v1`

All product endpoints require `Authorization: Bearer <Supabase access token>`.
Errors use FastAPI's `{ "detail": ... }` shape.

## Vocabulary

- `GET /notebooks/`
- `POST /notebooks/`
- `GET /notebooks/{notebook_id}`
- `PUT /notebooks/{notebook_id}`
- `DELETE /notebooks/{notebook_id}`
- `GET /vocab-items/notebook/{notebook_id}`
- `POST /vocab-items/?notebook_id={notebook_id}`
- `GET /vocab-items/{vocab_id}`
- `PUT /vocab-items/{vocab_id}`
- `DELETE /vocab-items/{vocab_id}`

Vocabulary responses include optional schedule fields:
`next_review_date`, `repetition_count`, `interval_days`, and `ease_factor`.

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

## Reviews and analytics

- `GET /reviews/due?limit=20&notebook_id={optional_uuid}`
- `GET /progress/summary`

The former standalone review submission API is not part of the public contract;
answers are submitted through a learning session.
