from app.core.models.learning_session import (
    LearningSession,
    LearningSessionStatus,
)
from app.core.models.review_history import ReviewHistory, ReviewTypeEnum


def test_review_type_enum_uses_database_values() -> None:
    enum_type = ReviewHistory.__table__.c.review_type.type
    assert enum_type.enums == [item.value for item in ReviewTypeEnum]


def test_learning_status_enum_uses_database_values() -> None:
    enum_type = LearningSession.__table__.c.status.type
    assert enum_type.enums == [item.value for item in LearningSessionStatus]
