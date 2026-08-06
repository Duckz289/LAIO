from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.core.models.game_session import GameSession
from app.core.models.notebook import Notebook
from app.core.models.review_history import ReviewTypeEnum


def start_game_session(
    db: Session,
    user_id: UUID,
    notebook_id: UUID | None,
    game_type: ReviewTypeEnum,
) -> GameSession | None:
    """Start a new game session."""
    if notebook_id is not None and db.scalar(
        select(Notebook.id).where(
            Notebook.id == notebook_id,
            Notebook.user_id == user_id,
            Notebook.is_archived.is_(False),
        )
    ) is None:
        return None

    session = GameSession(
        user_id=user_id,
        notebook_id=notebook_id,
        game_type=game_type,
        total_questions=0,
        correct_answers=0,
    )
    db.add(session)
    db.flush()
    db.refresh(session)
    return session


def end_game_session(
    db: Session,
    session_id: UUID,
    user_id: UUID,
    total_questions: int,
    correct_answers: int,
) -> GameSession | None:
    """End a game session and record results."""
    session = db.scalar(
        select(GameSession)
        .where(
            GameSession.id == session_id,
            GameSession.user_id == user_id,
            GameSession.ended_at.is_(None),
        )
        .with_for_update()
    )
    
    if not session:
        return None
    
    session.total_questions = total_questions
    session.correct_answers = correct_answers
    session.ended_at = datetime.now(timezone.utc)
    
    db.flush()
    db.refresh(session)
    return session


def get_game_session(
    db: Session,
    session_id: UUID,
    user_id: UUID,
) -> GameSession | None:
    """Get a game session by ID."""
    return db.query(GameSession).where(
        GameSession.id == session_id,
        GameSession.user_id == user_id,
    ).first()
