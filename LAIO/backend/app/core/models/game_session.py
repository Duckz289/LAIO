from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import Computed, DateTime, Enum, ForeignKey, Index, Integer, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from .review_history import ReviewTypeEnum

class GameSession(Base):
    __tablename__ = "game_sessions"
    user_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    notebook_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("notebooks.id", ondelete="SET NULL"),
        nullable=True
    )
    game_type: Mapped[ReviewTypeEnum] = mapped_column(
        Enum(
            ReviewTypeEnum,
            name="review_type_enum",
            create_type=False,
            values_callable=lambda enum: [item.value for item in enum],
        ),
        nullable=False,
    )
    total_questions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    correct_answers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    accuracy_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        Computed(
            "CASE WHEN total_questions > 0 "
            "THEN ROUND((correct_answers * 100.0) / total_questions, 2) "
            "ELSE 0.00 END",
            persisted=True,
        ),
        nullable=True,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    notebook: Mapped[Optional["Notebook"]] = relationship("Notebook", back_populates="game_sessions")


Index(
    "idx_game_sessions_user_date",
    GameSession.user_id,
    GameSession.started_at.desc(),
)
