from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel


class DueReviewItem(BaseModel):
    """Schema for a vocab item due for review."""
    vocab_item_id: UUID
    notebook_id: UUID
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
