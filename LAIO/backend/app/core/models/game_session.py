from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, Enum, Integer, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .review_history import ReviewTypeEnum


class GameSession(Base):
    __tablename__ = "game_sessions"

    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    notebook_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
    )
    game_type: Mapped[ReviewTypeEnum] = mapped_column(
        Enum(ReviewTypeEnum, name="review_type_enum", create_type=False),
        nullable=False,
    )
    total_questions: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    correct_answers: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    accuracy_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        nullable=False,
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    notebook: Mapped[Optional["Notebook"]] = relationship(
        "Notebook",
        back_populates="game_sessions",
    )