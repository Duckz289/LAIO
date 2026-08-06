from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator


class NotebookCreate(BaseModel):
    """Schema for creating a notebook."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(default="")


class NotebookUpdate(BaseModel):
    """Schema for updating a notebook."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    is_archived: bool | None = None

    @field_validator("title", "description", "is_archived")
    @classmethod
    def reject_null_for_database_required_fields(cls, value):
        if value is None:
            raise ValueError("Field cannot be null")
        return value


class NotebookResponse(BaseModel):
    """Schema for notebook response."""
    id: UUID
    user_id: UUID
    title: str
    description: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    vocab_count: int = 0
    mastered_count: int = 0
    due_count: int = 0

    model_config = {"from_attributes": True}


class NotebookListResponse(BaseModel):
    """Schema for list of notebooks."""
    notebooks: list[NotebookResponse]
    total: int
