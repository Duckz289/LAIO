from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, Field


class ReviewSubmit(BaseModel):
    """Schema for submitting a review result."""
    vocab_item_id: UUID
    score: int = Field(..., ge=0, le=5)
    review_type: str = Field(default="flashcard")
    time_spent_ms: int | None = None


class ReviewResponse(BaseModel):
    """Schema for review history response."""
    id: UUID
    vocab_item_id: UUID
    user_id: UUID
    score: int
    review_type: str
    time_spent_ms: int | None
    reviewed_at: datetime

    model_config = {"from_attributes": True}


class DueReviewItem(BaseModel):
    """Schema for a vocab item due for review."""
    vocab_item_id: UUID
    word: str
    meaning: str
    pronunciation: str | None
    example_sentence: str
    audio_url: str
    image_url: str
    ease_factor: float
    interval_days: int
    repetition_count: int
    next_review_date: date
    last_reviewed_at: datetime | None

    model_config = {"from_attributes": True}


class DueReviewsResponse(BaseModel):
    """Schema for list of due reviews."""
    items: list[DueReviewItem]
    total: int