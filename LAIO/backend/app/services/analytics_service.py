from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.core.models.notebook import Notebook
from app.core.models.review_history import ReviewHistory
from app.core.models.vocab_item import VocabItem
from app.core.models.vocab_progress import VocabProgress


def get_progress_summary(db: Session, user_id: UUID) -> dict:
    total_vocabulary = db.scalar(
        select(func.count())
        .select_from(VocabItem)
        .join(Notebook, Notebook.id == VocabItem.notebook_id)
        .where(Notebook.user_id == user_id, Notebook.is_archived.is_(False))
    ) or 0
    due_today = db.scalar(
        select(func.count())
        .select_from(VocabProgress)
        .join(VocabItem, VocabItem.id == VocabProgress.vocab_item_id)
        .join(Notebook, Notebook.id == VocabItem.notebook_id)
        .where(
            Notebook.user_id == user_id,
            VocabProgress.user_id == user_id,
            VocabProgress.next_review_date <= func.current_date(),
            Notebook.is_archived.is_(False),
        )
    ) or 0
    reviews_completed = db.scalar(
        select(func.count())
        .select_from(ReviewHistory)
        .where(ReviewHistory.user_id == user_id)
    ) or 0
    correct_reviews = db.scalar(
        select(func.count())
        .select_from(ReviewHistory)
        .where(ReviewHistory.user_id == user_id, ReviewHistory.score >= 3)
    ) or 0
    review_dates = set(
        db.scalars(
            select(func.date(ReviewHistory.reviewed_at))
            .where(ReviewHistory.user_id == user_id)
            .distinct()
            .order_by(func.date(ReviewHistory.reviewed_at).desc())
        ).all()
    )
    streak = 0
    cursor = date.today()
    if cursor not in review_dates:
        cursor -= timedelta(days=1)
    while cursor in review_dates:
        streak += 1
        cursor -= timedelta(days=1)

    return {
        "total_vocabulary": total_vocabulary,
        "due_today": due_today,
        "reviews_completed": reviews_completed,
        "correct_reviews": correct_reviews,
        "accuracy_percentage": round(
            correct_reviews / reviews_completed * 100, 2
        ) if reviews_completed else 0,
        "current_streak_days": streak,
    }
