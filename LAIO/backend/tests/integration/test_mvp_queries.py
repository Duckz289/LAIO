from uuid import uuid4

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.models import Base
from app.core.models.notebook import Notebook
from app.core.models.review_history import ReviewHistory
from app.core.models.vocab_item import VocabItem
from app.core.models.vocab_progress import VocabProgress
from app.services.analytics_service import get_progress_summary
from app.services.review_service import get_due_reviews
from app.services.vocab_service import list_vocab_items


def make_session() -> Session:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    return Session(engine)


def test_progress_summary_includes_notebook_count_and_accuracy() -> None:
    db = make_session()
    user_id = uuid4()
    notebook = Notebook(user_id=user_id, title="Core", description="")
    db.add(notebook)
    db.flush()
    vocab = VocabItem(notebook_id=notebook.id, word="one", meaning="một")
    db.add(vocab)
    db.flush()
    db.add(VocabProgress(vocab_item_id=vocab.id, user_id=user_id))
    db.add_all(
        [
            ReviewHistory(vocab_item_id=vocab.id, user_id=user_id, score=5),
            ReviewHistory(vocab_item_id=vocab.id, user_id=user_id, score=1),
        ]
    )
    db.flush()

    summary = get_progress_summary(db, user_id)

    assert summary["total_notebooks"] == 1
    assert summary["total_vocabulary"] == 1
    assert summary["reviews_completed"] == 2
    assert summary["accuracy_percentage"] == 50.0


def test_due_review_total_is_not_truncated_by_page_limit() -> None:
    db = make_session()
    user_id = uuid4()
    notebook = Notebook(user_id=user_id, title="Due", description="")
    db.add(notebook)
    db.flush()
    for index in range(3):
        vocab = VocabItem(
            notebook_id=notebook.id,
            word=f"word-{index}",
            meaning=str(index),
        )
        db.add(vocab)
        db.flush()
        db.add(VocabProgress(vocab_item_id=vocab.id, user_id=user_id))
    db.flush()

    items, total = get_due_reviews(db, user_id, limit=1)

    assert len(items) == 1
    assert total == 3


def test_vocabulary_list_is_paginated_with_stable_total() -> None:
    db = make_session()
    user_id = uuid4()
    notebook = Notebook(user_id=user_id, title="Paged", description="")
    db.add(notebook)
    db.flush()
    for index in range(3):
        db.add(
            VocabItem(
                notebook_id=notebook.id,
                word=f"word-{index}",
                meaning=str(index),
            )
        )
    db.flush()

    result = list_vocab_items(db, notebook.id, user_id, limit=1, offset=1)

    assert result is not None
    items, total = result
    assert len(items) == 1
    assert total == 3
