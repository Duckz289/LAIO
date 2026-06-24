from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.models.learning_session import LearningSessionStatus
from app.core.models.review_history import ReviewTypeEnum


class LearningSessionCreate(BaseModel):
    notebook_id: UUID | None = None
    limit: int = Field(default=20, ge=1, le=50)
    skill_type: str = Field(default="vocabulary", pattern="^vocabulary$")


class LearningAnswerCreate(BaseModel):
    vocab_item_id: UUID
    score: int = Field(ge=0, le=5)
    review_type: ReviewTypeEnum = ReviewTypeEnum.FLASHCARD
    time_spent_ms: int | None = Field(default=None, ge=0, le=3_600_000)


class LearningSessionResponse(BaseModel):
    id: UUID
    notebook_id: UUID | None
    skill_type: str
    status: LearningSessionStatus
    planned_items: int
    answered_items: int
    correct_answers: int
    accuracy_percentage: float
    started_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class LearningAnswerResponse(BaseModel):
    review_id: UUID
    correct: bool
    schedule: dict
    session: LearningSessionResponse
