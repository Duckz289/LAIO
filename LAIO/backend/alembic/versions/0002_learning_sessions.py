"""Add learning sessions and review schedule snapshots.

Revision ID: 0002
Revises: 0001
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

session_status = postgresql.ENUM(
    "active",
    "completed",
    "abandoned",
    name="learning_session_status",
    create_type=False,
)


def upgrade() -> None:
    session_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "learning_sessions",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("notebook_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("skill_type", sa.String(50), nullable=False, server_default="vocabulary"),
        sa.Column("status", session_status, nullable=False, server_default="active"),
        sa.Column("planned_items", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("answered_items", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("correct_answers", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("accuracy_percentage", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["notebook_id"], ["notebooks.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_learning_sessions_user_id", "learning_sessions", ["user_id"])
    op.create_index("ix_learning_sessions_notebook_id", "learning_sessions", ["notebook_id"])
    op.create_index("ix_learning_sessions_status", "learning_sessions", ["status"])
    op.add_column("review_history", sa.Column("learning_session_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("review_history", sa.Column("ease_factor_before", sa.Float(), nullable=True))
    op.add_column("review_history", sa.Column("ease_factor_after", sa.Float(), nullable=True))
    op.add_column("review_history", sa.Column("interval_days_before", sa.Integer(), nullable=True))
    op.add_column("review_history", sa.Column("interval_days_after", sa.Integer(), nullable=True))
    op.add_column("review_history", sa.Column("next_review_date", sa.Date(), nullable=True))
    op.create_foreign_key(
        "fk_review_history_learning_session",
        "review_history",
        "learning_sessions",
        ["learning_session_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_review_history_learning_session_id",
        "review_history",
        ["learning_session_id"],
    )
    op.create_unique_constraint(
        "uq_review_history_session_vocab",
        "review_history",
        ["learning_session_id", "vocab_item_id"],
    )
    op.execute(
        """
        INSERT INTO vocab_progress (
            id,
            vocab_item_id,
            user_id,
            ease_factor,
            interval_days,
            repetition_count,
            next_review_date,
            created_at,
            updated_at
        )
        SELECT
            gen_random_uuid(),
            vocab_items.id,
            notebooks.user_id,
            2.5,
            1,
            0,
            CURRENT_DATE,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM vocab_items
        JOIN notebooks ON notebooks.id = vocab_items.notebook_id
        LEFT JOIN vocab_progress
            ON vocab_progress.vocab_item_id = vocab_items.id
            AND vocab_progress.user_id = notebooks.user_id
        WHERE vocab_progress.id IS NULL
        """
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_review_history_session_vocab",
        "review_history",
        type_="unique",
    )
    op.drop_index("ix_review_history_learning_session_id", table_name="review_history")
    op.drop_constraint("fk_review_history_learning_session", "review_history", type_="foreignkey")
    for column in (
        "next_review_date",
        "interval_days_after",
        "interval_days_before",
        "ease_factor_after",
        "ease_factor_before",
        "learning_session_id",
    ):
        op.drop_column("review_history", column)
    op.drop_table("learning_sessions")
    session_status.drop(op.get_bind(), checkfirst=True)
