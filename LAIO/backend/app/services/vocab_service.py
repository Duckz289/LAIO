from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.models.vocab_item import VocabItem
from app.core.models.notebook import Notebook
from app.schemas.vocab_item import VocabItemCreate, VocabItemUpdate


async def verify_notebook_owner(
    db: AsyncSession,
    notebook_id: UUID,
    user_id: UUID,
) -> bool:
    """Check if user owns the notebook."""
    stmt = select(Notebook).where(
        Notebook.id == notebook_id,
        Notebook.user_id == user_id,
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None


async def create_vocab_item(
    db: AsyncSession,
    notebook_id: UUID,
    user_id: UUID,
    data: VocabItemCreate,
) -> VocabItem | None:
    """Create a new vocab item in a notebook."""
    # Verify ownership
    if not await verify_notebook_owner(db, notebook_id, user_id):
        return None
    
    vocab = VocabItem(
        notebook_id=notebook_id,
        word=data.word,
        meaning=data.meaning,
        pronunciation=data.pronunciation,
        example_sentence=data.example_sentence,
        audio_url=data.audio_url,
        image_url=data.image_url,
        pos=data.pos,
        difficulty_level=data.difficulty_level,
    )
    db.add(vocab)
    await db.flush()
    await db.refresh(vocab)
    return vocab


async def get_vocab_item(
    db: AsyncSession,
    vocab_id: UUID,
    user_id: UUID,
) -> VocabItem | None:
    """Get a vocab item (only if user owns its notebook)."""
    stmt = (
        select(VocabItem)
        .join(Notebook, Notebook.id == VocabItem.notebook_id)
        .where(
            VocabItem.id == vocab_id,
            Notebook.user_id == user_id,
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_vocab_items(
    db: AsyncSession,
    notebook_id: UUID,
    user_id: UUID,
) -> tuple[list[VocabItem], int] | None:
    """List vocab items in a notebook."""
    if not await verify_notebook_owner(db, notebook_id, user_id):
        return None
    
    stmt = (
        select(VocabItem)
        .where(VocabItem.notebook_id == notebook_id)
        .order_by(VocabItem.created_at.desc())
    )
    result = await db.execute(stmt)
    items = result.scalars().all()
    
    count_stmt = (
        select(func.count())
        .select_from(VocabItem)
        .where(VocabItem.notebook_id == notebook_id)
    )
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0
    
    return list(items), total


async def update_vocab_item(
    db: AsyncSession,
    vocab_id: UUID,
    user_id: UUID,
    data: VocabItemUpdate,
) -> VocabItem | None:
    """Update a vocab item."""
    vocab = await get_vocab_item(db, vocab_id, user_id)
    if not vocab:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vocab, key, value)
    
    await db.flush()
    await db.refresh(vocab)
    return vocab


async def delete_vocab_item(
    db: AsyncSession,
    vocab_id: UUID,
    user_id: UUID,
) -> bool:
    """Delete a vocab item."""
    vocab = await get_vocab_item(db, vocab_id, user_id)
    if not vocab:
        return False
    
    await db.delete(vocab)
    await db.flush()
    return True