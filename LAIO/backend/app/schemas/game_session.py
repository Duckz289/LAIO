from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.core.models.review_history import ReviewTypeEnum


class GameSessionStart(BaseModel):
    """Schema for starting a game session."""

    model_config = ConfigDict(extra="forbid")

    notebook_id: UUID | None = None
    game_type: ReviewTypeEnum


class GameSessionEnd(BaseModel):
    """Schema for ending a game session."""

    model_config = ConfigDict(extra="forbid")

    total_questions: int = Field(ge=0)
    correct_answers: int = Field(ge=0)

    @model_validator(mode="after")
    def validate_score_counts(self):
        if self.correct_answers > self.total_questions:
            raise ValueError("correct_answers cannot exceed total_questions")
        return self


class GameSessionResponse(BaseModel):
    """Schema for game session response."""
    id: UUID
    user_id: UUID
    notebook_id: UUID | None
    game_type: ReviewTypeEnum
    total_questions: int
    correct_answers: int
    accuracy_percentage: float
    started_at: datetime
    ended_at: datetime | None

    model_config = {"from_attributes": True}
