from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class GameSessionStart(BaseModel):
    """Schema for starting a game session."""
    notebook_id: UUID | None = None
    game_type: str


class GameSessionEnd(BaseModel):
    """Schema for ending a game session."""
    total_questions: int
    correct_answers: int


class GameSessionResponse(BaseModel):
    """Schema for game session response."""
    id: UUID
    user_id: UUID
    notebook_id: UUID | None
    game_type: str
    total_questions: int
    correct_answers: int
    accuracy_percentage: float
    started_at: datetime
    ended_at: datetime | None

    model_config = {"from_attributes": True}