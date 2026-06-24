from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.models.notebook import Notebook
from app.core.models.review_history import ReviewHistory, ReviewTypeEnum
from app.core.models.vocab_item import VocabItem
from app.core.models.vocab_progress import VocabProgress
from app.services.sm2_service import calculate_sm2


def get_due_reviews(
    db: Session,
    user_id: UUID,
    limit: int = 20,
    notebook_id: UUID | None = None,
) -> list[dict]:
    stmt = (
        select(VocabItem, VocabProgress)
        .join(VocabProgress, VocabProgress.vocab_item_id == VocabItem.id)
        .join(Notebook, Notebook.id == VocabItem.notebook_id)
        .where(
            Notebook.user_id == user_id,
            VocabProgress.user_id == user_id,
            VocabProgress.next_review_date <= func.current_date(),
            Notebook.is_archived.is_(False),
        )
        .order_by(VocabProgress.next_review_date.asc(), VocabItem.created_at.asc())
        .limit(limit)
    )
    if notebook_id:
        stmt = stmt.where(Notebook.id == notebook_id)

    return [
        {
            "vocab_item_id": vocab.id,
            "notebook_id": vocab.notebook_id,
            "word": vocab.word,
            "meaning": vocab.meaning,
            "pronunciation": vocab.pronunciation,
            "example_sentence": vocab.example_sentence,
            "audio_url": vocab.audio_url,
            "image_url": vocab.image_url,
            "ease_factor": progress.ease_factor,
            "interval_days": progress.interval_days,
            "repetition_count": progress.repetition_count,
            "next_review_date": progress.next_review_date,
            "last_reviewed_at": progress.last_reviewed_at,
        }
        for vocab, progress in db.execute(stmt).all()
    ]


def apply_review(
    db: Session,
    user_id: UUID,
    vocab_item: VocabItem,
    score: int,
    review_type: str,
    time_spent_ms: int | None,
    learning_session_id: UUID | None,
) -> dict:
    progress = db.scalar(
        select(VocabProgress).where(
            VocabProgress.vocab_item_id == vocab_item.id,
            VocabProgress.user_id == user_id,
        )
    )
    if progress is None:
        progress = VocabProgress(vocab_item_id=vocab_item.id, user_id=user_id)
        db.add(progress)
        db.flush()

    ease_before = progress.ease_factor
    interval_before = progress.interval_days
    result = calculate_sm2(
        current_ease=ease_before,
        current_interval=interval_before,
        current_repetition=progress.repetition_count,
        score=score,
    )

    progress.ease_factor = result["ease_factor"]
    progress.interval_days = result["interval_days"]
    progress.repetition_count = result["repetition_count"]
    progress.next_review_date = result["next_review_date"]
    progress.last_reviewed_at = datetime.now(timezone.utc)

    review = ReviewHistory(
        vocab_item_id=vocab_item.id,
        user_id=user_id,
        learning_session_id=learning_session_id,
        score=score,
        review_type=ReviewTypeEnum(review_type),
        time_spent_ms=time_spent_ms,
        ease_factor_before=ease_before,
        ease_factor_after=progress.ease_factor,
        interval_days_before=interval_before,
        interval_days_after=progress.interval_days,
        next_review_date=progress.next_review_date,
    )
    db.add(review)
    db.flush()

    return {
        "review_id": review.id,
        "correct": score >= 3,
        "schedule": {
            "ease_factor": progress.ease_factor,
            "interval_days": progress.interval_days,
            "repetition_count": progress.repetition_count,
            "next_review_date": progress.next_review_date,
        },
    }
