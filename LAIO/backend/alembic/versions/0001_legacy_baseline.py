"""Create the original LAIO vocabulary schema.

Revision ID: 0001
Revises:
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

review_type = postgresql.ENUM(
    "multiple_choice",
    "typing",
    "matching",
    "flashcard",
    "listening",
    "speaking",
    name="review_type_enum",
    create_type=False,
)


def upgrade() -> None:
    review_type.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "notebooks",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notebooks_user_id", "notebooks", ["user_id"])
    op.create_table(
        "vocab_items",
        sa.Column("notebook_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("word", sa.String(500), nullable=False),
        sa.Column("meaning", sa.Text(), nullable=False),
        sa.Column("pronunciation", sa.String(500), nullable=True),
        sa.Column("example_sentence", sa.Text(), nullable=False, server_default=""),
        sa.Column("audio_url", sa.Text(), nullable=False, server_default=""),
        sa.Column("image_url", sa.Text(), nullable=False, server_default=""),
        sa.Column("pos", sa.String(100), nullable=True),
        sa.Column("difficulty_level", sa.SmallInteger(), nullable=False, server_default="1"),
        sa.Column("is_mastered", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["notebook_id"], ["notebooks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_vocab_items_notebook_id", "vocab_items", ["notebook_id"])
    op.create_index("ix_vocab_items_word", "vocab_items", ["word"])
    op.create_table(
        "vocab_progress",
        sa.Column("vocab_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ease_factor", sa.Float(), nullable=False, server_default="2.5"),
        sa.Column("interval_days", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("repetition_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("next_review_date", sa.Date(), server_default=sa.func.current_date(), nullable=False),
        sa.Column("last_reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["vocab_item_id"], ["vocab_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("vocab_item_id", "user_id", name="uq_vocab_progress_item_user"),
    )
    op.create_index("ix_vocab_progress_user_id", "vocab_progress", ["user_id"])
    op.create_index("ix_vocab_progress_vocab_item_id", "vocab_progress", ["vocab_item_id"])
    op.create_table(
        "review_history",
        sa.Column("vocab_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("score", sa.SmallInteger(), nullable=False),
        sa.Column("review_type", review_type, nullable=False),
        sa.Column("time_spent_ms", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["vocab_item_id"], ["vocab_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_review_history_user_id", "review_history", ["user_id"])
    op.create_index("ix_review_history_vocab_item_id", "review_history", ["vocab_item_id"])
    op.create_table(
        "game_sessions",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("notebook_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("game_type", review_type, nullable=False),
        sa.Column("total_questions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("correct_answers", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("accuracy_percentage", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["notebook_id"], ["notebooks.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_game_sessions_notebook_id", "game_sessions", ["notebook_id"])
    op.create_index("ix_game_sessions_user_id", "game_sessions", ["user_id"])


def downgrade() -> None:
    op.drop_table("game_sessions")
    op.drop_table("review_history")
    op.drop_table("vocab_progress")
    op.drop_table("vocab_items")
    op.drop_table("notebooks")
    review_type.drop(op.get_bind(), checkfirst=True)
