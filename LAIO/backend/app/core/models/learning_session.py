import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class LearningSessionStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class LearningSession(Base):
    __tablename__ = "learning_sessions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('active', 'completed', 'abandoned')",
            name="ck_learning_sessions_status",
        ),
        Index("idx_learning_sessions_user_status", "user_id", "status"),
    )

    user_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    notebook_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notebooks.id", ondelete="SET NULL"),
        nullable=True,
    )
    skill_type: Mapped[str] = mapped_column(
        String(50), default="vocabulary", nullable=False
    )
    status: Mapped[LearningSessionStatus] = mapped_column(
        Enum(
            LearningSessionStatus,
            native_enum=False,
            length=20,
            create_constraint=False,
            validate_strings=True,
            values_callable=lambda enum: [item.value for item in enum],
        ),
        default=LearningSessionStatus.ACTIVE,
        nullable=False,
    )
    planned_items: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    answered_items: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    correct_answers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    @property
    def accuracy_percentage(self) -> float:
        """Derive accuracy because schema v2 intentionally stores only counters."""
        if not self.answered_items:
            return 0.0
        return round(self.correct_answers / self.answered_items * 100, 2)

    review_history: Mapped[list["ReviewHistory"]] = relationship(
        "ReviewHistory", back_populates="learning_session", lazy="raise"
    )
    notebook: Mapped[Optional["Notebook"]] = relationship(
        "Notebook", back_populates="learning_sessions"
    )


Index(
    "idx_learning_sessions_user_date",
    LearningSession.user_id,
    LearningSession.started_at.desc(),
)
