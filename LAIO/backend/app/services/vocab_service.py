from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.models.notebook import Notebook
from app.core.models.vocab_item import VocabItem
from app.core.models.vocab_progress import VocabProgress
from app.schemas.vocab_item import VocabItemCreate, VocabItemUpdate


def _serialize_vocab(vocab: VocabItem, progress: VocabProgress | None) -> dict:
    return {
        **{
            column.name: getattr(vocab, column.name)
            for column in VocabItem.__table__.columns
        },
        "next_review_date": progress.next_review_date if progress else None,
        "repetition_count": progress.repetition_count if progress else 0,
        "interval_days": progress.interval_days if progress else 1,
        "ease_factor": progress.ease_factor if progress else 2.5,
    }


def _progress_for(db: Session, vocab_id: UUID, user_id: UUID) -> VocabProgress | None:
    return db.scalar(
        select(VocabProgress).where(
            VocabProgress.vocab_item_id == vocab_id,
            VocabProgress.user_id == user_id,
        )
    )


def verify_notebook_owner(db: Session, notebook_id: UUID, user_id: UUID) -> bool:
    return db.scalar(
        select(Notebook.id).where(
            Notebook.id == notebook_id,
            Notebook.user_id == user_id,
        )
    ) is not None


def create_vocab_item(
    db: Session,
    notebook_id: UUID,
    user_id: UUID,
    data: VocabItemCreate,
) -> dict | None:
    if not verify_notebook_owner(db, notebook_id, user_id):
        return None
    vocab = VocabItem(notebook_id=notebook_id, **data.model_dump())
    db.add(vocab)
    db.flush()

    # Schema v2 normally creates this row in the database trigger. Keep a
    # conditional fallback for databases where the trigger has not been
    # installed yet; the lookup after flush prevents a duplicate row when the
    # trigger is present.
    progress = _progress_for(db, vocab.id, user_id)
    if progress is None:
        progress = VocabProgress(vocab_item_id=vocab.id, user_id=user_id)
        db.add(progress)
        db.flush()
    return _serialize_vocab(vocab, progress)


def _get_vocab_entity(
    db: Session, vocab_id: UUID, user_id: UUID
) -> VocabItem | None:
    return db.scalar(
        select(VocabItem)
        .join(Notebook, Notebook.id == VocabItem.notebook_id)
        .where(VocabItem.id == vocab_id, Notebook.user_id == user_id)
    )


def get_vocab_item(db: Session, vocab_id: UUID, user_id: UUID) -> dict | None:
    vocab = _get_vocab_entity(db, vocab_id, user_id)
    if vocab is None:
        return None
    return _serialize_vocab(vocab, _progress_for(db, vocab.id, user_id))


def list_vocab_items(
    db: Session,
    notebook_id: UUID,
    user_id: UUID,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[dict], int] | None:
    if not verify_notebook_owner(db, notebook_id, user_id):
        return None
    stmt = (
        select(VocabItem, VocabProgress)
        .outerjoin(
            VocabProgress,
            (VocabProgress.vocab_item_id == VocabItem.id)
            & (VocabProgress.user_id == user_id),
        )
        .where(VocabItem.notebook_id == notebook_id)
        .order_by(VocabItem.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    items = [_serialize_vocab(vocab, progress) for vocab, progress in db.execute(stmt)]
    total = db.scalar(
        select(func.count())
        .select_from(VocabItem)
        .where(VocabItem.notebook_id == notebook_id)
    ) or 0
    return items, total


def update_vocab_item(
    db: Session,
    vocab_id: UUID,
    user_id: UUID,
    data: VocabItemUpdate,
) -> dict | None:
    vocab = _get_vocab_entity(db, vocab_id, user_id)
    if vocab is None:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(vocab, key, value)
    db.flush()
    return _serialize_vocab(vocab, _progress_for(db, vocab.id, user_id))


def delete_vocab_item(db: Session, vocab_id: UUID, user_id: UUID) -> bool:
    vocab = _get_vocab_entity(db, vocab_id, user_id)
    if vocab is None:
        return False
    db.delete(vocab)
    db.flush()
    return True


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def search_vocab_items(
    db: Session,
    notebook_id: UUID,
    user_id: UUID,
    keyword: str,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[dict], int] | None:
    if not verify_notebook_owner(db, notebook_id, user_id):
        return None
    normalized = keyword.strip()
    if not normalized:
        return [], 0
    pattern = f"%{_escape_like(normalized)}%"
    filters = (
        VocabItem.notebook_id == notebook_id,
        or_(
            VocabItem.word.ilike(pattern, escape="\\"),
            VocabItem.meaning.ilike(pattern, escape="\\"),
        ),
    )
    stmt = (
        select(VocabItem, VocabProgress)
        .outerjoin(
            VocabProgress,
            (VocabProgress.vocab_item_id == VocabItem.id)
            & (VocabProgress.user_id == user_id),
        )
        .where(*filters)
        .order_by(VocabItem.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    items = [_serialize_vocab(vocab, progress) for vocab, progress in db.execute(stmt)]
    total = db.scalar(
        select(func.count()).select_from(VocabItem).where(*filters)
    ) or 0
    return items, total
