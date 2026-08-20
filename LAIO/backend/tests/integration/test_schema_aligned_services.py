from uuid import uuid4

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.models import Base
from app.core.models.learning_session import LearningSessionStatus
from app.core.models.notebook import Notebook
from app.core.models.review_history import ReviewTypeEnum
from app.core.models.vocab_item import VocabItem
from app.core.models.vocab_progress import VocabProgress
from app.schemas.learning import LearningSessionCreate
from app.schemas.vocab_item import VocabItemCreate
from app.services.game_service import end_game_session, start_game_session
from app.services.learning_service import abandon_session, create_session
from app.services.notebook_service import list_notebooks
from app.services.vocab_service import create_vocab_item


def make_session() -> Session:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    return Session(engine)


def test_notebook_list_returns_database_backed_counts() -> None:
    db = make_session()
    user_id = uuid4()
    notebook = Notebook(user_id=user_id, title="IELTS", description="")
    db.add(notebook)
    db.flush()
    due = VocabItem(
        notebook_id=notebook.id,
        word="due",
        meaning="đến hạn",
        is_mastered=True,
    )
    db.add(due)
    db.flush()
    db.add(VocabProgress(vocab_item_id=due.id, user_id=user_id))
    db.flush()

    records, total = list_notebooks(db, user_id)

    assert total == 1
    assert records[0]["vocab_count"] == 1
    assert records[0]["mastered_count"] == 1
    assert records[0]["due_count"] == 1


def test_starting_new_session_abandons_previous_active_session() -> None:
    db = make_session()
    user_id = uuid4()
    notebook = Notebook(user_id=user_id, title="IELTS", description="")
    db.add(notebook)
    db.flush()
    vocab = VocabItem(notebook_id=notebook.id, word="one", meaning="một")
    db.add(vocab)
    db.flush()
    db.add(VocabProgress(vocab_item_id=vocab.id, user_id=user_id))
    db.flush()

    first = create_session(db, user_id, LearningSessionCreate(notebook_id=notebook.id))
    second = create_session(db, user_id, LearningSessionCreate(notebook_id=notebook.id))

    assert first is not None and first.status == LearningSessionStatus.ABANDONED
    assert second is not None and second.status == LearningSessionStatus.ACTIVE
    assert abandon_session(db, user_id, second.id) is second
    assert second.status == LearningSessionStatus.ABANDONED


def test_game_session_rejects_another_users_notebook() -> None:
    db = make_session()
    notebook = Notebook(user_id=uuid4(), title="Private", description="")
    db.add(notebook)
    db.flush()

    assert start_game_session(
        db,
        uuid4(),
        notebook.id,
        ReviewTypeEnum.FLASHCARD,
    ) is None


def test_game_accuracy_is_generated_instead_of_written_by_service() -> None:
    db = make_session()
    user_id = uuid4()
    notebook = Notebook(user_id=user_id, title="Games", description="")
    db.add(notebook)
    db.flush()

    game = start_game_session(
        db,
        user_id,
        notebook.id,
        ReviewTypeEnum.FLASHCARD,
    )
    assert game is not None
    ended = end_game_session(db, game.id, user_id, 4, 3)

    assert ended is not None
    assert float(ended.accuracy_percentage) == 75.0


def test_vocab_creation_keeps_progress_available_without_trigger() -> None:
    db = make_session()
    user_id = uuid4()
    notebook = Notebook(user_id=user_id, title="Words", description="")
    db.add(notebook)
    db.flush()

    created = create_vocab_item(
        db,
        notebook.id,
        user_id,
        VocabItemCreate(word="safe", meaning="an toàn"),
    )

    assert created is not None
    # SQLite has no Supabase trigger, so the service fallback must provide the
    # same invariant as the live database: exactly one progress row.
    progress = db.scalars(select(VocabProgress)).all()
    assert len(progress) == 1
    assert progress[0].vocab_item_id == created["id"]
    assert progress[0].user_id == user_id
