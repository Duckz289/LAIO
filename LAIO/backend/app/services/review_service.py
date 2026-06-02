from uuid import UUID
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from app.core.models.vocab_item import VocabItem
from app.core.models.vocab_progress import VocabProgress
from app.core.models.review_history import ReviewHistory
from app.core.models.notebook import Notebook
from app.services.sm2_service import calculate_sm2


async def get_due_reviews(
    db: AsyncSession,
    user_id: UUID,
    limit: int = 20,
) -> list[dict]:
    """Get vocab items due for review today."""
    stmt = (
        select(
            VocabItem.id.label("vocab_item_id"),
            VocabItem.word,
            VocabItem.meaning,
            VocabItem.pronunciation,
            VocabItem.example_sentence,
            VocabItem.audio_url,
            VocabItem.image_url,
            VocabProgress.ease_factor,
            VocabProgress.interval_days,
            VocabProgress.repetition_count,
            VocabProgress.next_review_date,
            VocabProgress.last_reviewed_at,
        )
        .join(VocabProgress, VocabProgress.vocab_item_id == VocabItem.id)
        .join(Notebook, Notebook.id == VocabItem.notebook_id)
        .where(
            VocabProgress.user_id == user_id,
            VocabProgress.next_review_date <= func.current_date(),
            Notebook.is_archived == False,
        )
        .order_by(VocabProgress.next_review_date.asc())
        .limit(limit)
    )
    
    result = await db.execute(stmt)
    rows = result.all()
    
    return [
        {
            "vocab_item_id": row.vocab_item_id,
            "word": row.word,
            "meaning": row.meaning,
            "pronunciation": row.pronunciation,
            "example_sentence": row.example_sentence,
            "audio_url": row.audio_url,
            "image_url": row.image_url,
            "ease_factor": row.ease_factor,
            "interval_days": row.interval_days,
            "repetition_count": row.repetition_count,
            "next_review_date": row.next_review_date,
            "last_reviewed_at": row.last_reviewed_at,
        }
        for row in rows
    ]


async def submit_review(
    db: AsyncSession,
    user_id: UUID,
    vocab_item_id: UUID,
    score: int,
    review_type: str = "flashcard",
    time_spent_ms: int | None = None,
) -> dict:
    """Submit a review result and update SM2 progress."""
    
    # Get or create progress
    stmt = select(VocabProgress).where(
        VocabProgress.vocab_item_id == vocab_item_id,
        VocabProgress.user_id == user_id,
    )
    result = await db.execute(stmt)
    progress = result.scalar_one_or_none()
    
    if not progress:
        progress = VocabProgress(
            vocab_item_id=vocab_item_id,
            user_id=user_id,
        )
        db.add(progress)
        await db.flush()
    
    # Calculate new SM2 values
    sm2_result = calculate_sm2(
        current_ease=progress.ease_factor,
        current_interval=progress.interval_days,
        current_repetition=progress.repetition_count,
        score=score,
    )
    
    # Update progress
    progress.ease_factor = sm2_result["ease_factor"]
    progress.interval_days = sm2_result["interval_days"]
    progress.repetition_count = sm2_result["repetition_count"]
    progress.next_review_date = sm2_result["next_review_date"]
    progress.last_reviewed_at = datetime.utcnow()
    
    # Create review history
    review = ReviewHistory(
        vocab_item_id=vocab_item_id,
        user_id=user_id,
        score=score,
        review_type=review_type,
        time_spent_ms=time_spent_ms,
    )
    db.add(review)
    
    await db.flush()
    
    return {
        "progress": {
            "ease_factor": progress.ease_factor,
            "interval_days": progress.interval_days,
            "repetition_count": progress.repetition_count,
            "next_review_date": progress.next_review_date,
        },
        "review_id": review.id,
    }