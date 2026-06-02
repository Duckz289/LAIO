from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.game_session import (
    GameSessionStart,
    GameSessionEnd,
    GameSessionResponse,
)
from app.services import game_service

router = APIRouter()


@router.post("/start", response_model=GameSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_game_session(
    data: GameSessionStart,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Start a new game session."""
    session = await game_service.start_game_session(
        db=db,
        user_id=UUID(user_id),
        notebook_id=data.notebook_id,
        game_type=data.game_type,
    )
    return session


@router.post("/{session_id}/end", response_model=GameSessionResponse)
async def end_game_session(
    session_id: UUID,
    data: GameSessionEnd,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """End a game session."""
    session = await game_service.end_game_session(
        db=db,
        session_id=session_id,
        user_id=UUID(user_id),
        total_questions=data.total_questions,
        correct_answers=data.correct_answers,
    )
    if not session:
        raise HTTPException(status_code=404, detail="Game session not found")
    return session


@router.get("/{session_id}", response_model=GameSessionResponse)
async def get_game_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Get a game session by ID."""
    session = await game_service.get_game_session(
        db=db,
        session_id=session_id,
        user_id=UUID(user_id),
    )
    if not session:
        raise HTTPException(status_code=404, detail="Game session not found")
    return session