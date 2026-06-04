from uuid import UUID
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session
from app.core.models.vocab_item import VocabItem
from app.core.models.notebook import Notebook
from app.schemas.vocab_item import VocabItemCreate, VocabItemUpdate


def verify_notebook_owner(db: Session, notebook_id: UUID, user_id: UUID) -> bool:
    stmt = select(Notebook).where(Notebook.id == notebook_id, Notebook.user_id == user_id)
    return db.scalar(stmt) is not None


def create_vocab_item(db: Session, notebook_id: UUID, user_id: UUID, data: VocabItemCreate) -> VocabItem | None:
    if not verify_notebook_owner(db, notebook_id, user_id):
        return None
    vocab = VocabItem(notebook_id=notebook_id, word=data.word, meaning=data.meaning,
                      pronunciation=data.pronunciation, example_sentence=data.example_sentence,
                      audio_url=data.audio_url, image_url=data.image_url,
                      pos=data.pos, difficulty_level=data.difficulty_level)
    db.add(vocab)
    db.flush()
    db.refresh(vocab)
    return vocab


def get_vocab_item(db: Session, vocab_id: UUID, user_id: UUID) -> VocabItem | None:
    stmt = (select(VocabItem).join(Notebook, Notebook.id == VocabItem.notebook_id)
            .where(VocabItem.id == vocab_id, Notebook.user_id == user_id))
    return db.scalar(stmt)


def list_vocab_items(db: Session, notebook_id: UUID, user_id: UUID) -> tuple[list[VocabItem], int] | None:
    if not verify_notebook_owner(db, notebook_id, user_id):
        return None
    stmt = select(VocabItem).where(VocabItem.notebook_id == notebook_id).order_by(VocabItem.created_at.desc())
    items = db.scalars(stmt).all()
    total = db.scalar(select(func.count()).select_from(VocabItem).where(VocabItem.notebook_id == notebook_id)) or 0
    return list(items), total


def update_vocab_item(db: Session, vocab_id: UUID, user_id: UUID, data: VocabItemUpdate) -> VocabItem | None:
    vocab = get_vocab_item(db, vocab_id, user_id)
    if not vocab:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(vocab, key, value)
    db.flush()
    db.refresh(vocab)
    return vocab


def delete_vocab_item(db: Session, vocab_id: UUID, user_id: UUID) -> bool:
    vocab = get_vocab_item(db, vocab_id, user_id)
    if not vocab:
        return False
    db.delete(vocab)
    db.flush()
    return True


def review_vocab_item(db: Session, vocab_id: UUID, user_id: UUID, is_mastered: bool) -> VocabItem | None:
    vocab = get_vocab_item(db, vocab_id, user_id)
    if not vocab:
        return None
    if is_mastered:
        vocab.difficulty_level = min(vocab.difficulty_level + 1, 5)
        vocab.is_mastered = True
    else:
        vocab.difficulty_level = 1
        vocab.is_mastered = False
    db.flush()
    db.refresh(vocab)
    return vocab


def search_vocab_items(db: Session, notebook_id: UUID, user_id: UUID, keyword: str) -> tuple[list[VocabItem], int] | None:
    if not verify_notebook_owner(db, notebook_id, user_id):
        return None
    stmt = (select(VocabItem).where(
        VocabItem.notebook_id == notebook_id,
        or_(func.lower(VocabItem.word).contains(keyword.lower()),
            func.lower(VocabItem.meaning).contains(keyword.lower()))))
    items = db.scalars(stmt).all()
    return list(items), len(items)