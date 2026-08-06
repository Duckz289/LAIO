import enum
from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class ReviewTypeEnum(str, enum.Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TYPING = "typing"
    MATCHING = "matching"
    FLASHCARD = "flashcard"
    LISTENING = "listening"
    SPEAKING = "speaking"


class ReviewHistory(Base):
    __tablename__ = "review_history"
    __table_args__ = (
        UniqueConstraint(
            "learning_session_id",
            "vocab_item_id",
            name="uq_review_history_session_vocab",
        ),
        CheckConstraint("score BETWEEN 0 AND 5", name="ck_review_history_score"),
        Index(
            "idx_review_history_session",
            "learning_session_id",
            postgresql_where=text("learning_session_id IS NOT NULL"),
            sqlite_where=text("learning_session_id IS NOT NULL"),
        ),
    )

    vocab_item_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vocab_items.id", ondelete="CASCADE"),  # ✅ thêm dòng này
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )
    learning_session_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("learning_sessions.id", ondelete="SET NULL"),
        nullable=True,
    )
    score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    review_type: Mapped[ReviewTypeEnum] = mapped_column(
        Enum(
            ReviewTypeEnum,
            name="review_type_enum",
            create_type=False,
            values_callable=lambda enum: [item.value for item in enum],
        ),
        default=ReviewTypeEnum.FLASHCARD,
        nullable=False,
    )
    time_spent_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ease_before: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ease_after: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    interval_before: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    interval_after: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    next_review_date_after: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    vocab_item: Mapped["VocabItem"] = relationship("VocabItem", back_populates="review_history")
    learning_session: Mapped[Optional["LearningSession"]] = relationship(
        "LearningSession", back_populates="review_history"
    )


Index(
    "idx_review_history_user_date",
    ReviewHistory.user_id,
    ReviewHistory.reviewed_at.desc(),
)
Index(
    "idx_review_history_item_user",
    ReviewHistory.vocab_item_id,
    ReviewHistory.user_id,
    ReviewHistory.reviewed_at.desc(),
)
