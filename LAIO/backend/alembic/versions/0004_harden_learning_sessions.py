"""Prevent more than one active learning session per user.

Revision ID: 0004
Revises: 0003
"""

from alembic import op


revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        WITH ranked AS (
            SELECT id,
                   ROW_NUMBER() OVER (
                       PARTITION BY user_id ORDER BY started_at DESC, id DESC
                   ) AS row_number
            FROM learning_sessions
            WHERE status = 'active'
        )
        UPDATE learning_sessions AS session
        SET status = 'abandoned', completed_at = NOW()
        FROM ranked
        WHERE session.id = ranked.id AND ranked.row_number > 1;

        CREATE UNIQUE INDEX IF NOT EXISTS uq_learning_sessions_one_active_per_user
            ON learning_sessions(user_id)
            WHERE status = 'active';
        """
    )


def downgrade() -> None:
    op.execute(
        "DROP INDEX IF EXISTS uq_learning_sessions_one_active_per_user"
    )
