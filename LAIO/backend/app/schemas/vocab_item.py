from datetime import date, datetime
from urllib.parse import urlparse
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator


class VocabItemCreate(BaseModel):
    """Schema for creating a vocab item."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    word: str = Field(..., min_length=1, max_length=500)
    meaning: str = Field(..., min_length=1, max_length=10_000)
    pronunciation: str | None = Field(default=None, max_length=500)
    example_sentence: str = Field(default="", max_length=10_000)
    audio_url: str = Field(default="", max_length=2_048)
    image_url: str = Field(default="", max_length=2_048)
    pos: str | None = Field(default=None, max_length=100)
    difficulty_level: int = Field(default=1, ge=1, le=5)
    is_mastered: bool = False

    @field_validator("audio_url", "image_url")
    @classmethod
    def validate_external_url(cls, value: str) -> str:
        if not value:
            return value
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("URL must use http or https")
        return value


class VocabItemUpdate(BaseModel):
    """Schema for updating a vocab item."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    word: str | None = Field(default=None, min_length=1, max_length=500)
    meaning: str | None = Field(default=None, min_length=1, max_length=10_000)
    pronunciation: str | None = Field(default=None, max_length=500)
    example_sentence: str | None = Field(default=None, max_length=10_000)
    audio_url: str | None = Field(default=None, max_length=2_048)
    image_url: str | None = Field(default=None, max_length=2_048)
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

    @field_validator("audio_url", "image_url")
    @classmethod
    def validate_external_url(cls, value: str | None) -> str | None:
        if value in {None, ""}:
            return value
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("URL must use http or https")
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
    limit: int
    offset: int
