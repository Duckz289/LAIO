"""Align the legacy Alembic schema with the Supabase LAIO schema v2.

Revision ID: 0003
Revises: 0002

This revision is for databases created by revisions 0001/0002. A Supabase
database that was created directly from the canonical v2 SQL should be stamped
at this revision instead of replaying the legacy migrations.
"""

from alembic import op


revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    op.execute(
        """
        ALTER TABLE notebooks ALTER COLUMN id SET DEFAULT uuid_generate_v4();
        ALTER TABLE vocab_items ALTER COLUMN id SET DEFAULT uuid_generate_v4();
        ALTER TABLE vocab_progress ALTER COLUMN id SET DEFAULT uuid_generate_v4();
        ALTER TABLE learning_sessions ALTER COLUMN id SET DEFAULT uuid_generate_v4();
        ALTER TABLE review_history ALTER COLUMN id SET DEFAULT uuid_generate_v4();
        ALTER TABLE game_sessions ALTER COLUMN id SET DEFAULT uuid_generate_v4();

        ALTER TABLE learning_sessions ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE learning_sessions
            ALTER COLUMN status TYPE VARCHAR(20) USING status::text;
        ALTER TABLE learning_sessions ALTER COLUMN status SET DEFAULT 'active';
        DROP TYPE IF EXISTS learning_session_status;
        ALTER TABLE learning_sessions DROP COLUMN accuracy_percentage;

        ALTER TABLE review_history RENAME COLUMN ease_factor_before TO ease_before;
        ALTER TABLE review_history RENAME COLUMN ease_factor_after TO ease_after;
        ALTER TABLE review_history RENAME COLUMN interval_days_before TO interval_before;
        ALTER TABLE review_history RENAME COLUMN interval_days_after TO interval_after;
        ALTER TABLE review_history RENAME COLUMN next_review_date TO next_review_date_after;
        ALTER TABLE review_history ALTER COLUMN review_type SET DEFAULT 'flashcard';

        ALTER TABLE game_sessions DROP COLUMN accuracy_percentage;
        ALTER TABLE game_sessions ADD COLUMN accuracy_percentage NUMERIC(5,2)
            GENERATED ALWAYS AS (
                CASE WHEN total_questions > 0
                     THEN ROUND((correct_answers::NUMERIC / total_questions::NUMERIC) * 100, 2)
                     ELSE 0.00 END
            ) STORED;
        ALTER TABLE game_sessions DROP COLUMN created_at;
        """
    )

    op.execute(
        """
        ALTER TABLE notebooks
            ADD CONSTRAINT fk_notebooks_user
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        ALTER TABLE vocab_progress
            ADD CONSTRAINT fk_vocab_progress_user
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        ALTER TABLE learning_sessions
            ADD CONSTRAINT fk_learning_sessions_user
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        ALTER TABLE review_history
            ADD CONSTRAINT fk_review_history_user
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        ALTER TABLE game_sessions
            ADD CONSTRAINT fk_game_sessions_user
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

        ALTER TABLE vocab_items
            ADD CONSTRAINT ck_vocab_items_difficulty
            CHECK (difficulty_level BETWEEN 1 AND 5);
        ALTER TABLE vocab_progress
            ADD CONSTRAINT ck_vocab_progress_ease CHECK (ease_factor >= 1.3),
            ADD CONSTRAINT ck_vocab_progress_interval CHECK (interval_days >= 0),
            ADD CONSTRAINT ck_vocab_progress_repetition CHECK (repetition_count >= 0);
        ALTER TABLE learning_sessions
            ADD CONSTRAINT ck_learning_sessions_status
            CHECK (status IN ('active', 'completed', 'abandoned'));
        ALTER TABLE review_history
            ADD CONSTRAINT ck_review_history_score CHECK (score BETWEEN 0 AND 5);
        """
    )

    op.execute(
        """
        DROP INDEX IF EXISTS ix_notebooks_user_id;
        DROP INDEX IF EXISTS ix_vocab_items_notebook_id;
        DROP INDEX IF EXISTS ix_vocab_items_word;
        DROP INDEX IF EXISTS ix_vocab_progress_user_id;
        DROP INDEX IF EXISTS ix_vocab_progress_vocab_item_id;
        DROP INDEX IF EXISTS ix_learning_sessions_user_id;
        DROP INDEX IF EXISTS ix_learning_sessions_notebook_id;
        DROP INDEX IF EXISTS ix_learning_sessions_status;
        DROP INDEX IF EXISTS ix_review_history_user_id;
        DROP INDEX IF EXISTS ix_review_history_vocab_item_id;
        DROP INDEX IF EXISTS ix_review_history_learning_session_id;
        DROP INDEX IF EXISTS ix_game_sessions_user_id;
        DROP INDEX IF EXISTS ix_game_sessions_notebook_id;

        CREATE INDEX idx_notebooks_user_active
            ON notebooks(user_id, is_archived, created_at DESC);
        CREATE INDEX idx_vocab_items_notebook
            ON vocab_items(notebook_id, created_at DESC);
        CREATE INDEX idx_vocab_items_word_trgm
            ON vocab_items USING gin (word gin_trgm_ops);
        CREATE INDEX idx_vocab_progress_due
            ON vocab_progress(user_id, next_review_date);
        CREATE INDEX idx_vocab_progress_vocab_item
            ON vocab_progress(vocab_item_id);
        CREATE INDEX idx_learning_sessions_user_status
            ON learning_sessions(user_id, status);
        CREATE INDEX idx_learning_sessions_user_date
            ON learning_sessions(user_id, started_at DESC);
        CREATE INDEX idx_review_history_user_date
            ON review_history(user_id, reviewed_at DESC);
        CREATE INDEX idx_review_history_item_user
            ON review_history(vocab_item_id, user_id, reviewed_at DESC);
        CREATE INDEX idx_review_history_session
            ON review_history(learning_session_id)
            WHERE learning_session_id IS NOT NULL;
        CREATE INDEX idx_game_sessions_user_date
            ON game_sessions(user_id, started_at DESC);
        """
    )

    op.execute(
        """
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trg_notebooks_updated_at
            BEFORE UPDATE ON notebooks
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        CREATE TRIGGER trg_vocab_items_updated_at
            BEFORE UPDATE ON vocab_items
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        CREATE TRIGGER trg_vocab_progress_updated_at
            BEFORE UPDATE ON vocab_progress
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        CREATE OR REPLACE FUNCTION fn_create_vocab_progress()
        RETURNS TRIGGER AS $$
        DECLARE
            v_user_id UUID;
        BEGIN
            SELECT user_id INTO v_user_id FROM notebooks WHERE id = NEW.notebook_id;
            INSERT INTO vocab_progress (vocab_item_id, user_id)
            VALUES (NEW.id, v_user_id)
            ON CONFLICT (vocab_item_id, user_id) DO NOTHING;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trg_vocab_items_create_progress
            AFTER INSERT ON vocab_items
            FOR EACH ROW EXECUTE FUNCTION fn_create_vocab_progress();
        """
    )

    op.execute(
        """
        ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
        ALTER TABLE vocab_items ENABLE ROW LEVEL SECURITY;
        ALTER TABLE vocab_progress ENABLE ROW LEVEL SECURITY;
        ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;
        ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

        CREATE POLICY own_notebooks ON notebooks FOR ALL TO authenticated
            USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        CREATE POLICY own_vocab_items ON vocab_items FOR ALL TO authenticated
            USING (EXISTS (
                SELECT 1 FROM notebooks
                WHERE notebooks.id = vocab_items.notebook_id
                  AND notebooks.user_id = auth.uid()
            ))
            WITH CHECK (EXISTS (
                SELECT 1 FROM notebooks
                WHERE notebooks.id = vocab_items.notebook_id
                  AND notebooks.user_id = auth.uid()
            ));
        CREATE POLICY own_vocab_progress ON vocab_progress FOR ALL TO authenticated
            USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        CREATE POLICY own_review_history ON review_history FOR ALL TO authenticated
            USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        CREATE POLICY own_learning_sessions ON learning_sessions FOR ALL TO authenticated
            USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        CREATE POLICY own_game_sessions ON game_sessions FOR ALL TO authenticated
            USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

        CREATE OR REPLACE VIEW user_progress_summary AS
        SELECT
            n.user_id,
            COUNT(DISTINCT vi.id) AS total_vocabulary,
            COUNT(DISTINCT CASE
                WHEN vp.next_review_date <= CURRENT_DATE THEN vp.vocab_item_id
            END) AS due_today,
            COUNT(DISTINCT CASE WHEN vi.is_mastered THEN vi.id END) AS mastered_items
        FROM notebooks n
        LEFT JOIN vocab_items vi ON vi.notebook_id = n.id
        LEFT JOIN vocab_progress vp
            ON vp.vocab_item_id = vi.id AND vp.user_id = n.user_id
        WHERE NOT n.is_archived
        GROUP BY n.user_id;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DROP VIEW IF EXISTS user_progress_summary;
        DROP POLICY IF EXISTS own_game_sessions ON game_sessions;
        DROP POLICY IF EXISTS own_learning_sessions ON learning_sessions;
        DROP POLICY IF EXISTS own_review_history ON review_history;
        DROP POLICY IF EXISTS own_vocab_progress ON vocab_progress;
        DROP POLICY IF EXISTS own_vocab_items ON vocab_items;
        DROP POLICY IF EXISTS own_notebooks ON notebooks;

        DROP TRIGGER IF EXISTS trg_vocab_items_create_progress ON vocab_items;
        DROP FUNCTION IF EXISTS fn_create_vocab_progress();
        DROP TRIGGER IF EXISTS trg_vocab_progress_updated_at ON vocab_progress;
        DROP TRIGGER IF EXISTS trg_vocab_items_updated_at ON vocab_items;
        DROP TRIGGER IF EXISTS trg_notebooks_updated_at ON notebooks;
        DROP FUNCTION IF EXISTS update_updated_at_column();

        DROP INDEX IF EXISTS idx_game_sessions_user_date;
        DROP INDEX IF EXISTS idx_review_history_session;
        DROP INDEX IF EXISTS idx_review_history_item_user;
        DROP INDEX IF EXISTS idx_review_history_user_date;
        DROP INDEX IF EXISTS idx_learning_sessions_user_date;
        DROP INDEX IF EXISTS idx_learning_sessions_user_status;
        DROP INDEX IF EXISTS idx_vocab_progress_vocab_item;
        DROP INDEX IF EXISTS idx_vocab_progress_due;
        DROP INDEX IF EXISTS idx_vocab_items_word_trgm;
        DROP INDEX IF EXISTS idx_vocab_items_notebook;
        DROP INDEX IF EXISTS idx_notebooks_user_active;

        CREATE INDEX ix_notebooks_user_id ON notebooks(user_id);
        CREATE INDEX ix_vocab_items_notebook_id ON vocab_items(notebook_id);
        CREATE INDEX ix_vocab_items_word ON vocab_items(word);
        CREATE INDEX ix_vocab_progress_user_id ON vocab_progress(user_id);
        CREATE INDEX ix_vocab_progress_vocab_item_id ON vocab_progress(vocab_item_id);
        CREATE INDEX ix_learning_sessions_user_id ON learning_sessions(user_id);
        CREATE INDEX ix_learning_sessions_notebook_id ON learning_sessions(notebook_id);
        CREATE INDEX ix_learning_sessions_status ON learning_sessions(status);
        CREATE INDEX ix_review_history_user_id ON review_history(user_id);
        CREATE INDEX ix_review_history_vocab_item_id ON review_history(vocab_item_id);
        CREATE INDEX ix_review_history_learning_session_id
            ON review_history(learning_session_id);
        CREATE INDEX ix_game_sessions_user_id ON game_sessions(user_id);
        CREATE INDEX ix_game_sessions_notebook_id ON game_sessions(notebook_id);

        ALTER TABLE notebooks DISABLE ROW LEVEL SECURITY;
        ALTER TABLE vocab_items DISABLE ROW LEVEL SECURITY;
        ALTER TABLE vocab_progress DISABLE ROW LEVEL SECURITY;
        ALTER TABLE review_history DISABLE ROW LEVEL SECURITY;
        ALTER TABLE learning_sessions DISABLE ROW LEVEL SECURITY;
        ALTER TABLE game_sessions DISABLE ROW LEVEL SECURITY;

        ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS fk_game_sessions_user;
        ALTER TABLE review_history DROP CONSTRAINT IF EXISTS fk_review_history_user;
        ALTER TABLE learning_sessions DROP CONSTRAINT IF EXISTS fk_learning_sessions_user;
        ALTER TABLE vocab_progress DROP CONSTRAINT IF EXISTS fk_vocab_progress_user;
        ALTER TABLE notebooks DROP CONSTRAINT IF EXISTS fk_notebooks_user;
        ALTER TABLE review_history DROP CONSTRAINT IF EXISTS ck_review_history_score;
        ALTER TABLE learning_sessions DROP CONSTRAINT IF EXISTS ck_learning_sessions_status;
        ALTER TABLE vocab_progress DROP CONSTRAINT IF EXISTS ck_vocab_progress_repetition;
        ALTER TABLE vocab_progress DROP CONSTRAINT IF EXISTS ck_vocab_progress_interval;
        ALTER TABLE vocab_progress DROP CONSTRAINT IF EXISTS ck_vocab_progress_ease;
        ALTER TABLE vocab_items DROP CONSTRAINT IF EXISTS ck_vocab_items_difficulty;

        ALTER TABLE game_sessions DROP COLUMN accuracy_percentage;
        ALTER TABLE game_sessions ADD COLUMN accuracy_percentage NUMERIC(5,2)
            NOT NULL DEFAULT 0;
        ALTER TABLE game_sessions ADD COLUMN created_at TIMESTAMPTZ
            NOT NULL DEFAULT NOW();

        ALTER TABLE review_history RENAME COLUMN ease_before TO ease_factor_before;
        ALTER TABLE review_history RENAME COLUMN ease_after TO ease_factor_after;
        ALTER TABLE review_history RENAME COLUMN interval_before TO interval_days_before;
        ALTER TABLE review_history RENAME COLUMN interval_after TO interval_days_after;
        ALTER TABLE review_history RENAME COLUMN next_review_date_after TO next_review_date;
        ALTER TABLE review_history ALTER COLUMN review_type DROP DEFAULT;

        CREATE TYPE learning_session_status AS ENUM ('active', 'completed', 'abandoned');
        ALTER TABLE learning_sessions ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE learning_sessions
            ALTER COLUMN status TYPE learning_session_status
            USING status::text::learning_session_status;
        ALTER TABLE learning_sessions ALTER COLUMN status SET DEFAULT 'active';
        ALTER TABLE learning_sessions ADD COLUMN accuracy_percentage NUMERIC(5,2)
            NOT NULL DEFAULT 0;
        """
    )
