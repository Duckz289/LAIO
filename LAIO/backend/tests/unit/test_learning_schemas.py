from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.game_session import GameSessionEnd
from app.schemas.learning import LearningAnswerCreate, LearningSessionCreate
from app.schemas.notebook import NotebookUpdate
from app.schemas.vocab_item import VocabItemCreate, VocabItemUpdate


def test_learning_session_limit_is_bounded() -> None:
    with pytest.raises(ValidationError):
        LearningSessionCreate(limit=51)


def test_learning_answer_score_is_bounded() -> None:
    with pytest.raises(ValidationError):
        LearningAnswerCreate(vocab_item_id=uuid4(), score=6)


def test_learning_answer_accepts_supported_review_type() -> None:
    answer = LearningAnswerCreate(
        vocab_item_id=uuid4(),
        score=4,
        review_type="flashcard",
        time_spent_ms=1200,
    )
    assert answer.score == 4


def test_requests_reject_unknown_database_fields() -> None:
    with pytest.raises(ValidationError):
        VocabItemCreate(word="test", meaning="thử", next_review_date="2026-01-01")


@pytest.mark.parametrize(
    ("schema", "payload"),
    [
        (NotebookUpdate, {"description": None}),
        (VocabItemUpdate, {"word": None}),
        (VocabItemUpdate, {"difficulty_level": None}),
    ],
)
def test_updates_reject_null_for_not_null_columns(schema, payload) -> None:
    with pytest.raises(ValidationError):
        schema(**payload)


def test_game_counts_preserve_database_invariants() -> None:
    with pytest.raises(ValidationError):
        GameSessionEnd(total_questions=2, correct_answers=3)
