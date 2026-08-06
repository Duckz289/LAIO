from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.models.learning_session import LearningSession, LearningSessionStatus
from app.core.models.notebook import Notebook
from app.core.models.vocab_item import VocabItem
from app.core.models.vocab_progress import VocabProgress
from app.schemas.notebook import NotebookCreate, NotebookUpdate


def _response_statement(user_id: UUID):
    vocab_count = (
        select(func.count(VocabItem.id))
        .where(VocabItem.notebook_id == Notebook.id)
        .correlate(Notebook)
        .scalar_subquery()
    )
    mastered_count = (
        select(func.count(VocabItem.id))
        .where(
            VocabItem.notebook_id == Notebook.id,
            VocabItem.is_mastered.is_(True),
        )
        .correlate(Notebook)
        .scalar_subquery()
    )
    due_count = (
        select(func.count(VocabProgress.id))
        .join(VocabItem, VocabItem.id == VocabProgress.vocab_item_id)
        .where(
            VocabItem.notebook_id == Notebook.id,
            VocabProgress.user_id == user_id,
            VocabProgress.next_review_date <= func.current_date(),
        )
        .correlate(Notebook)
        .scalar_subquery()
    )
    return select(
        Notebook,
        vocab_count.label("vocab_count"),
        mastered_count.label("mastered_count"),
        due_count.label("due_count"),
    )


def _serialize_notebook(row) -> dict:
    notebook, vocab_count, mastered_count, due_count = row
    return {
        **{
            column.name: getattr(notebook, column.name)
            for column in Notebook.__table__.columns
        },
        "vocab_count": int(vocab_count or 0),
        "mastered_count": int(mastered_count or 0),
        "due_count": int(due_count or 0),
    }


def create_notebook(db: Session, user_id: UUID, data: NotebookCreate) -> dict:
    notebook = Notebook(user_id=user_id, title=data.title, description=data.description)
    db.add(notebook)
    db.flush()
    row = db.execute(
        _response_statement(user_id).where(Notebook.id == notebook.id)
    ).one()
    return _serialize_notebook(row)


def get_notebook(db: Session, notebook_id: UUID, user_id: UUID) -> Notebook | None:
    return db.scalar(
        select(Notebook).where(
            Notebook.id == notebook_id,
            Notebook.user_id == user_id,
        )
    )


def get_notebook_response(
    db: Session, notebook_id: UUID, user_id: UUID
) -> dict | None:
    row = db.execute(
        _response_statement(user_id).where(
            Notebook.id == notebook_id,
            Notebook.user_id == user_id,
        )
    ).one_or_none()
    return _serialize_notebook(row) if row else None


def list_notebooks(
    db: Session, user_id: UUID, include_archived: bool = False
) -> tuple[list[dict], int]:
    stmt = _response_statement(user_id).where(Notebook.user_id == user_id)
    count_stmt = (
        select(func.count()).select_from(Notebook).where(Notebook.user_id == user_id)
    )
    if not include_archived:
        stmt = stmt.where(Notebook.is_archived.is_(False))
        count_stmt = count_stmt.where(Notebook.is_archived.is_(False))

    rows = db.execute(stmt.order_by(Notebook.created_at.desc())).all()
    return [_serialize_notebook(row) for row in rows], db.scalar(count_stmt) or 0


def update_notebook(
    db: Session,
    notebook_id: UUID,
    user_id: UUID,
    data: NotebookUpdate,
) -> dict | None:
    notebook = get_notebook(db, notebook_id, user_id)
    if notebook is None:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(notebook, key, value)
    db.flush()
    return get_notebook_response(db, notebook_id, user_id)


def delete_notebook(db: Session, notebook_id: UUID, user_id: UUID) -> bool:
    notebook = get_notebook(db, notebook_id, user_id)
    if notebook is None:
        return False

    # ON DELETE SET NULL must not turn a notebook-scoped active session into a
    # cross-notebook session. Close it before deleting the parent.
    db.execute(
        update(LearningSession)
        .where(
            LearningSession.user_id == user_id,
            LearningSession.notebook_id == notebook_id,
            LearningSession.status == LearningSessionStatus.ACTIVE,
        )
        .values(
            status=LearningSessionStatus.ABANDONED,
            completed_at=datetime.now(timezone.utc),
        )
    )
    db.delete(notebook)
    db.flush()
    return True
