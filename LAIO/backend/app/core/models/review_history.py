import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, SmallInteger, func
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

    vocab_item_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vocab_items.id", ondelete="CASCADE"),  # ✅ thêm dòng này
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    review_type: Mapped[ReviewTypeEnum] = mapped_column(
        Enum(ReviewTypeEnum, name="review_type_enum", create_type=False),
        default=ReviewTypeEnum.FLASHCARD,
        nullable=False,
    )
    time_spent_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )

    vocab_item: Mapped["VocabItem"] = relationship("VocabItem", back_populates="review_history")