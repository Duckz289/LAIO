from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, SmallInteger, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class VocabItem(Base):
    __tablename__ = "vocab_items"

    notebook_id: Mapped[UUID] = mapped_column(
        ForeignKey("notebooks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    word: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        index=True,
    )
    meaning: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    pronunciation: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    example_sentence: Mapped[str] = mapped_column(
        Text,
        default="",
        nullable=False,
    )
    audio_url: Mapped[str] = mapped_column(
        Text,
        default="",
        nullable=False,
    )
    image_url: Mapped[str] = mapped_column(
        Text,
        default="",
        nullable=False,
    )
    pos: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Part of speech",
    )
    difficulty_level: Mapped[int] = mapped_column(
        SmallInteger,
        default=1,
        nullable=False,
    )
    is_mastered: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    notebook: Mapped["Notebook"] = relationship(
        "Notebook",
        back_populates="vocab_items",
    )
    progress: Mapped[List["VocabProgress"]] = relationship(
        "VocabProgress",
        back_populates="vocab_item",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    review_history: Mapped[List["ReviewHistory"]] = relationship(
        "ReviewHistory",
        back_populates="vocab_item",
        cascade="all, delete-orphan",
        lazy="selectin",
    )