from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.models.learning_session import LearningSession, LearningSessionStatus
from app.core.models.notebook import Notebook
from app.core.models.review_history import ReviewHistory
from app.core.models.vocab_item import VocabItem
from app.core.models.vocab_progress import VocabProgress
from app.schemas.learning import LearningAnswerCreate, LearningSessionCreate
from app.services.review_service import apply_review


def create_session(
    db: Session,
    user_id: UUID,
    data: LearningSessionCreate,
) -> LearningSession | None:
    if data.notebook_id and not db.scalar(
        select(Notebook.id).where(
            Notebook.id == data.notebook_id,
            Notebook.user_id == user_id,
            Notebook.is_archived.is_(False),
        )
    ):
        return None

    due_stmt = (
        select(func.count())
        .select_from(VocabProgress)
        .join(VocabItem, VocabItem.id == VocabProgress.vocab_item_id)
        .join(Notebook, Notebook.id == VocabItem.notebook_id)
        .where(
            Notebook.user_id == user_id,
            Notebook.is_archived.is_(False),
            VocabProgress.user_id == user_id,
            VocabProgress.next_review_date <= func.current_date(),
        )
    )
    if data.notebook_id:
        due_stmt = due_stmt.where(Notebook.id == data.notebook_id)
    due_count = db.scalar(due_stmt) or 0

    session = LearningSession(
        user_id=user_id,
        notebook_id=data.notebook_id,
        skill_type=data.skill_type,
        planned_items=min(due_count, data.limit),
        status=(
            LearningSessionStatus.ACTIVE
            if due_count
            else LearningSessionStatus.COMPLETED
        ),
        completed_at=None if due_count else datetime.now(timezone.utc),
    )
    db.add(session)
    db.flush()
    db.refresh(session)
    return session


def submit_answer(
    db: Session,
    user_id: UUID,
    session_id: UUID,
    data: LearningAnswerCreate,
) -> tuple[LearningSession, dict] | None:
    session = db.scalar(
        select(LearningSession).where(
            LearningSession.id == session_id,
            LearningSession.user_id == user_id,
            LearningSession.status == LearningSessionStatus.ACTIVE,
        )
    )
    if session is None:
        return None
    if session.answered_items >= session.planned_items:
        raise ValueError("Learning session has no remaining answers")
    if db.scalar(
        select(ReviewHistory.id).where(
            ReviewHistory.learning_session_id == session.id,
            ReviewHistory.vocab_item_id == data.vocab_item_id,
        )
    ):
        raise ValueError("Vocabulary item was already answered in this session")

    vocab = db.scalar(
        select(VocabItem)
        .join(Notebook, Notebook.id == VocabItem.notebook_id)
        .join(
            VocabProgress,
            (VocabProgress.vocab_item_id == VocabItem.id)
            & (VocabProgress.user_id == user_id),
        )
        .where(
            VocabItem.id == data.vocab_item_id,
            Notebook.user_id == user_id,
            VocabProgress.next_review_date <= func.current_date(),
        )
    )
    if vocab is None or (
        session.notebook_id is not None and vocab.notebook_id != session.notebook_id
    ):
        return None

    result = apply_review(
        db=db,
        user_id=user_id,
        vocab_item=vocab,
        score=data.score,
        review_type=data.review_type.value,
        time_spent_ms=data.time_spent_ms,
        learning_session_id=session.id,
    )
    session.answered_items += 1
    if result["correct"]:
        session.correct_answers += 1
    session.accuracy_percentage = round(
        session.correct_answers / session.answered_items * 100, 2
    )
    db.flush()
    db.refresh(session)
    return session, result


def complete_session(
    db: Session, user_id: UUID, session_id: UUID
) -> LearningSession | None:
    session = db.scalar(
        select(LearningSession).where(
            LearningSession.id == session_id,
            LearningSession.user_id == user_id,
            LearningSession.status == LearningSessionStatus.ACTIVE,
        )
    )
    if session is None:
        return None
    session.status = LearningSessionStatus.COMPLETED
    session.completed_at = datetime.now(timezone.utc)
    db.flush()
    db.refresh(session)
    return session
