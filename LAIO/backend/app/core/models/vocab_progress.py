from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class VocabProgress(Base):
    __tablename__ = "vocab_progress"
    __table_args__ = (
        UniqueConstraint(
            "vocab_item_id",
            "user_id",
            name="uq_vocab_progress_item_user",
        ),
        CheckConstraint("ease_factor >= 1.3", name="ck_vocab_progress_ease"),
        CheckConstraint("interval_days >= 0", name="ck_vocab_progress_interval"),
        CheckConstraint(
            "repetition_count >= 0", name="ck_vocab_progress_repetition"
        ),
        Index("idx_vocab_progress_due", "user_id", "next_review_date"),
        Index("idx_vocab_progress_vocab_item", "vocab_item_id"),
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
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5, nullable=False)
    interval_days: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    repetition_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    next_review_date: Mapped[date] = mapped_column(
        Date, default=func.current_date(), nullable=False
    )
    last_reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    vocab_item: Mapped["VocabItem"] = relationship("VocabItem", back_populates="progress")
