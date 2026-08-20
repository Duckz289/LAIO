from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.learning import (
    LearningAnswerCreate,
    LearningAnswerResponse,
    LearningSessionCreate,
    LearningSessionResponse,
)
from app.services import learning_service

router = APIRouter()


@router.post("", response_model=LearningSessionResponse, status_code=status.HTTP_201_CREATED)
def create_learning_session(
    data: LearningSessionCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user),
):
    try:
        session = learning_service.create_session(db, user_id, data)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Another learning session was started concurrently. Try again.",
        ) from exc
    if session is None:
        raise HTTPException(status_code=404, detail="Notebook not found")
    return session


@router.post("/{session_id}/answers", response_model=LearningAnswerResponse)
def submit_learning_answer(
    session_id: UUID,
    data: LearningAnswerCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user),
):
    try:
        submitted = learning_service.submit_answer(
            db, user_id, session_id, data
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Vocabulary item was already answered in this session",
        ) from exc
    if submitted is None:
        raise HTTPException(
            status_code=404, detail="Active session or vocabulary item not found"
        )
    session, result = submitted
    return {**result, "session": session}


@router.post("/{session_id}/complete", response_model=LearningSessionResponse)
def complete_learning_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user),
):
    session = learning_service.complete_session(db, user_id, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Active session not found")
    return session


@router.post("/{session_id}/abandon", response_model=LearningSessionResponse)
def abandon_learning_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user),
):
    session = learning_service.abandon_session(db, user_id, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Active session not found")
    return session
