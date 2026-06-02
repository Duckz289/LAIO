from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class VocabItemCreate(BaseModel):
    """Schema for creating a vocab item."""
    word: str = Field(..., min_length=1, max_length=500)
    meaning: str = Field(..., min_length=1)
    pronunciation: str | None = None
    example_sentence: str = Field(default="")
    audio_url: str = Field(default="")
    image_url: str = Field(default="")
    pos: str | None = None
    difficulty_level: int = Field(default=1, ge=1, le=5)


class VocabItemUpdate(BaseModel):
    """Schema for updating a vocab item."""
    word: str | None = None
    meaning: str | None = None
    pronunciation: str | None = None
    example_sentence: str | None = None
    audio_url: str | None = None
    image_url: str | None = None
    pos: str | None = None
    difficulty_level: int | None = Field(None, ge=1, le=5)
    is_mastered: bool | None = None


class VocabItemResponse(BaseModel):
    """Schema for vocab item response."""
    id: UUID
    notebook_id: UUID
    word: str
    meaning: str
    pronunciation: str | None
    example_sentence: str
    audio_url: str
    image_url: str
    pos: str | None
    difficulty_level: int
    is_mastered: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VocabItemListResponse(BaseModel):
    """Schema for list of vocab items."""
    vocab_items: list[VocabItemResponse]
    total: int