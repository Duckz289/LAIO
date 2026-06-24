from uuid import uuid4

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.models import Base
from app.core.models.notebook import Notebook
from app.core.models.review_history import ReviewHistory
from app.core.models.vocab_item import VocabItem
from app.core.models.vocab_progress import VocabProgress
from app.schemas.learning import LearningAnswerCreate, LearningSessionCreate
from app.services.learning_service import create_session, submit_answer


def make_session() -> Session:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    return Session(engine)


def test_learning_answer_updates_schedule_and_history() -> None:
    db = make_session()
    user_id = uuid4()
    notebook = Notebook(user_id=user_id, title="IELTS", description="")
    db.add(notebook)
    db.flush()
    vocab = VocabItem(notebook_id=notebook.id, word="analyze", meaning="phân tích")
    db.add(vocab)
    db.flush()
    db.add(VocabProgress(vocab_item_id=vocab.id, user_id=user_id))
    db.flush()

    learning_session = create_session(
        db, user_id, LearningSessionCreate(notebook_id=notebook.id)
    )
    assert learning_session is not None
    submitted = submit_answer(
        db,
        user_id,
        learning_session.id,
        LearningAnswerCreate(vocab_item_id=vocab.id, score=4),
    )

    assert submitted is not None
    updated_session, result = submitted
    assert updated_session.answered_items == 1
    assert updated_session.correct_answers == 1
    assert result["schedule"]["repetition_count"] == 1
    history = db.scalar(select(ReviewHistory))
    assert history is not None
    assert history.learning_session_id == learning_session.id
    assert history.interval_days_before == 1
    assert history.interval_days_after == 1


def test_user_cannot_start_session_for_another_users_notebook() -> None:
    db = make_session()
    owner_id = uuid4()
    notebook = Notebook(user_id=owner_id, title="Private", description="")
    db.add(notebook)
    db.flush()

    session = create_session(
        db,
        uuid4(),
        LearningSessionCreate(notebook_id=notebook.id),
    )
    assert session is None


def test_empty_session_is_completed_immediately() -> None:
    db = make_session()
    user_id = uuid4()
    notebook = Notebook(user_id=user_id, title="Empty", description="")
    db.add(notebook)
    db.flush()

    session = create_session(
        db, user_id, LearningSessionCreate(notebook_id=notebook.id)
    )

    assert session is not None
    assert session.status.value == "completed"
    assert session.completed_at is not None


def test_same_vocabulary_cannot_be_answered_twice_in_one_session() -> None:
    db = make_session()
    user_id = uuid4()
    notebook = Notebook(user_id=user_id, title="IELTS", description="")
    db.add(notebook)
    db.flush()
    vocab = VocabItem(notebook_id=notebook.id, word="analyze", meaning="phân tích")
    other_vocab = VocabItem(
        notebook_id=notebook.id,
        word="significant",
        meaning="quan trọng",
    )
    db.add_all([vocab, other_vocab])
    db.flush()
    db.add_all(
        [
            VocabProgress(vocab_item_id=vocab.id, user_id=user_id),
            VocabProgress(vocab_item_id=other_vocab.id, user_id=user_id),
        ]
    )
    db.flush()
    learning_session = create_session(
        db, user_id, LearningSessionCreate(notebook_id=notebook.id)
    )
    assert learning_session is not None
    answer = LearningAnswerCreate(vocab_item_id=vocab.id, score=4)
    assert submit_answer(db, user_id, learning_session.id, answer) is not None

    try:
        submit_answer(db, user_id, learning_session.id, answer)
    except ValueError as exc:
        assert "already answered" in str(exc)
    else:
        raise AssertionError("Expected duplicate answer to be rejected")


def test_session_rejects_answers_beyond_planned_limit() -> None:
    db = make_session()
    user_id = uuid4()
    notebook = Notebook(user_id=user_id, title="Limit", description="")
    db.add(notebook)
    db.flush()
    first = VocabItem(notebook_id=notebook.id, word="first", meaning="một")
    second = VocabItem(notebook_id=notebook.id, word="second", meaning="hai")
    db.add_all([first, second])
    db.flush()
    db.add_all(
        [
            VocabProgress(vocab_item_id=first.id, user_id=user_id),
            VocabProgress(vocab_item_id=second.id, user_id=user_id),
        ]
    )
    db.flush()
    learning_session = create_session(
        db,
        user_id,
        LearningSessionCreate(notebook_id=notebook.id, limit=1),
    )
    assert learning_session is not None
    assert submit_answer(
        db,
        user_id,
        learning_session.id,
        LearningAnswerCreate(vocab_item_id=first.id, score=4),
    )

    try:
        submit_answer(
            db,
            user_id,
            learning_session.id,
            LearningAnswerCreate(vocab_item_id=second.id, score=4),
        )
    except ValueError as exc:
        assert "no remaining answers" in str(exc)
    else:
        raise AssertionError("Expected session limit to be enforced")
