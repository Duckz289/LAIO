from sqlalchemy import Computed

from app.core.models.game_session import GameSession
from app.core.models.learning_session import LearningSession
from app.core.models.notebook import Notebook
from app.core.models.review_history import ReviewHistory
from app.core.models.vocab_item import VocabItem
from app.core.models.vocab_progress import VocabProgress


EXPECTED_COLUMNS = {
    Notebook: {
        "id",
        "user_id",
        "title",
        "description",
        "is_archived",
        "created_at",
        "updated_at",
    },
    VocabItem: {
        "id",
        "notebook_id",
        "word",
        "meaning",
        "pronunciation",
        "example_sentence",
        "audio_url",
        "image_url",
        "pos",
        "difficulty_level",
        "is_mastered",
        "created_at",
        "updated_at",
    },
    VocabProgress: {
        "id",
        "vocab_item_id",
        "user_id",
        "ease_factor",
        "interval_days",
        "repetition_count",
        "next_review_date",
        "last_reviewed_at",
        "created_at",
        "updated_at",
    },
    LearningSession: {
        "id",
        "user_id",
        "notebook_id",
        "skill_type",
        "status",
        "planned_items",
        "answered_items",
        "correct_answers",
        "started_at",
        "completed_at",
        "created_at",
    },
    ReviewHistory: {
        "id",
        "vocab_item_id",
        "user_id",
        "learning_session_id",
        "score",
        "review_type",
        "time_spent_ms",
        "ease_before",
        "ease_after",
        "interval_before",
        "interval_after",
        "next_review_date_after",
        "reviewed_at",
        "created_at",
    },
    GameSession: {
        "id",
        "user_id",
        "notebook_id",
        "game_type",
        "total_questions",
        "correct_answers",
        "accuracy_percentage",
        "started_at",
        "ended_at",
    },
}

EXPECTED_INDEXES = {
    Notebook: {"idx_notebooks_user_active"},
    VocabItem: {"idx_vocab_items_notebook", "idx_vocab_items_word_trgm"},
    VocabProgress: {"idx_vocab_progress_due", "idx_vocab_progress_vocab_item"},
    LearningSession: {
        "idx_learning_sessions_user_status",
        "idx_learning_sessions_user_date",
        "uq_learning_sessions_one_active_per_user",
    },
    ReviewHistory: {
        "idx_review_history_user_date",
        "idx_review_history_item_user",
        "idx_review_history_session",
    },
    GameSession: {"idx_game_sessions_user_date"},
}


def test_orm_columns_match_supabase_schema_v2() -> None:
    for model, expected in EXPECTED_COLUMNS.items():
        assert set(model.__table__.columns.keys()) == expected


def test_orm_indexes_match_supabase_schema_v2() -> None:
    for model, expected in EXPECTED_INDEXES.items():
        assert {index.name for index in model.__table__.indexes} == expected


def test_game_accuracy_is_database_generated() -> None:
    assert isinstance(GameSession.__table__.c.accuracy_percentage.computed, Computed)


def test_learning_accuracy_is_derived_not_persisted() -> None:
    session = LearningSession(answered_items=4, correct_answers=3)
    assert session.accuracy_percentage == 75.0
