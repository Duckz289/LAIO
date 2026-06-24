import enum
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class LearningSessionStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    user_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    notebook_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notebooks.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    skill_type: Mapped[str] = mapped_column(
        String(50), default="vocabulary", nullable=False
    )
    status: Mapped[LearningSessionStatus] = mapped_column(
        Enum(
            LearningSessionStatus,
            name="learning_session_status",
            values_callable=lambda enum: [item.value for item in enum],
        ),
        default=LearningSessionStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    planned_items: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    answered_items: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    correct_answers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    accuracy_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=0, nullable=False
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    review_history: Mapped[list["ReviewHistory"]] = relationship(
        "ReviewHistory", back_populates="learning_session", lazy="selectin"
    )
    notebook: Mapped[Optional["Notebook"]] = relationship(
        "Notebook", back_populates="learning_sessions"
    )
