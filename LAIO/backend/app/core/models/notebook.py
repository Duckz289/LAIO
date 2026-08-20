from datetime import datetime
from typing import List

from sqlalchemy import Boolean, DateTime, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Notebook(Base):
    __tablename__ = "notebooks"

    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        Text,
        default="",
        nullable=False,
    )
    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    vocab_items: Mapped[List["VocabItem"]] = relationship(
        "VocabItem",
        back_populates="notebook",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="raise",
    )
    game_sessions: Mapped[List["GameSession"]] = relationship(
        "GameSession",
        back_populates="notebook",
        passive_deletes=True,
        lazy="raise",
    )
    learning_sessions: Mapped[List["LearningSession"]] = relationship(
        "LearningSession",
        back_populates="notebook",
        passive_deletes=True,
        lazy="raise",
    )


Index(
    "idx_notebooks_user_active",
    Notebook.user_id,
    Notebook.is_archived,
    Notebook.created_at.desc(),
)
