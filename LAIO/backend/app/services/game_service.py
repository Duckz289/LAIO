from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.models.game_session import GameSession


async def start_game_session(
    db: Session,
    user_id: UUID,
    notebook_id: UUID | None,
    game_type: str,
) -> GameSession:
    """Start a new game session."""
    session = GameSession(
        user_id=user_id,
        notebook_id=notebook_id,
        game_type=game_type,
        total_questions=0,
        correct_answers=0,
        accuracy_percentage=0.0,
        started_at=datetime.utcnow(),
    )
    db.add(session)
    db.flush()
    db.refresh(session)
    return session


async def end_game_session(
    db: Session,
    session_id: UUID,
    user_id: UUID,
    total_questions: int,
    correct_answers: int,
) -> GameSession | None:
    """End a game session and record results."""
    session = db.query(GameSession).where(
        GameSession.id == session_id,
        GameSession.user_id == user_id,
    ).first()
    
    if not session:
        return None
    
    session.total_questions = total_questions
    session.correct_answers = correct_answers
    session.ended_at = datetime.utcnow()
    
    db.flush()
    db.refresh(session)
    return session


async def get_game_session(
    db: Session,
    session_id: UUID,
    user_id: UUID,
) -> GameSession | None:
    """Get a game session by ID."""
    return db.query(GameSession).where(
        GameSession.id == session_id,
        GameSession.user_id == user_id,
    ).first()