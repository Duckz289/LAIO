from datetime import date, timedelta

import pytest

from app.services.sm2_service import calculate_sm2


def test_first_success_schedules_tomorrow() -> None:
    result = calculate_sm2(2.5, 1, 0, 4)

    assert result["repetition_count"] == 1
    assert result["interval_days"] == 1
    assert result["next_review_date"] == date.today() + timedelta(days=1)


def test_second_success_schedules_six_days() -> None:
    result = calculate_sm2(2.5, 1, 1, 5)

    assert result["repetition_count"] == 2
    assert result["interval_days"] == 6


def test_failure_resets_repetition_and_interval() -> None:
    result = calculate_sm2(2.2, 12, 4, 1)

    assert result["repetition_count"] == 0
    assert result["interval_days"] == 1
    assert result["ease_factor"] >= 1.3


@pytest.mark.parametrize("score", [-1, 6])
def test_rejects_invalid_score(score: int) -> None:
    with pytest.raises(ValueError):
        calculate_sm2(2.5, 1, 0, score)
