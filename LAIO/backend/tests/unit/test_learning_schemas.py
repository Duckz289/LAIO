from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.learning import LearningAnswerCreate, LearningSessionCreate


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
