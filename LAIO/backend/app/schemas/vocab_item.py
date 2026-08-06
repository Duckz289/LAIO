from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator


class VocabItemCreate(BaseModel):
    """Schema for creating a vocab item."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    word: str = Field(..., min_length=1, max_length=500)
    meaning: str = Field(..., min_length=1)
    pronunciation: str | None = Field(default=None, max_length=500)
    example_sentence: str = Field(default="")
    audio_url: str = Field(default="")
    image_url: str = Field(default="")
    pos: str | None = Field(default=None, max_length=100)
    difficulty_level: int = Field(default=1, ge=1, le=5)
    is_mastered: bool = False


class VocabItemUpdate(BaseModel):
    """Schema for updating a vocab item."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    word: str | None = Field(default=None, min_length=1, max_length=500)
    meaning: str | None = Field(default=None, min_length=1)
    pronunciation: str | None = Field(default=None, max_length=500)
    example_sentence: str | None = None
    audio_url: str | None = None
    image_url: str | None = None
    pos: str | None = Field(default=None, max_length=100)
    difficulty_level: int | None = Field(None, ge=1, le=5)
    is_mastered: bool | None = None

    @field_validator(
        "word",
        "meaning",
        "example_sentence",
        "audio_url",
        "image_url",
        "difficulty_level",
        "is_mastered",
    )
    @classmethod
    def reject_null_for_database_required_fields(cls, value):
        if value is None:
            raise ValueError("Field cannot be null")
        return value


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
    next_review_date: date | None = None
    repetition_count: int = 0
    interval_days: int = 1
    ease_factor: float = 2.5

    model_config = {"from_attributes": True}


class VocabItemListResponse(BaseModel):
    """Schema for list of vocab items."""
    vocab_items: list[VocabItemResponse]
    total: int
