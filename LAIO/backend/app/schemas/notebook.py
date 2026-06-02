from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class NotebookCreate(BaseModel):
    """Schema for creating a notebook."""
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(default="")


class NotebookUpdate(BaseModel):
    """Schema for updating a notebook."""
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    is_archived: bool | None = None


class NotebookResponse(BaseModel):
    """Schema for notebook response."""
    id: UUID
    user_id: UUID
    title: str
    description: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NotebookListResponse(BaseModel):
    """Schema for list of notebooks."""
    notebooks: list[NotebookResponse]
    total: int