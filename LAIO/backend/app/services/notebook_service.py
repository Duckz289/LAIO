from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.models.notebook import Notebook
from app.schemas.notebook import NotebookCreate, NotebookUpdate


async def create_notebook(
    db: AsyncSession,
    user_id: UUID,
    data: NotebookCreate,
) -> Notebook:
    """Create a new notebook."""
    notebook = Notebook(
        user_id=user_id,
        title=data.title,
        description=data.description,
    )
    db.add(notebook)
    await db.flush()
    await db.refresh(notebook)
    return notebook


async def get_notebook(
    db: AsyncSession,
    notebook_id: UUID,
    user_id: UUID,
) -> Notebook | None:
    """Get a notebook by id (only if owned by user)."""
    stmt = select(Notebook).where(
        Notebook.id == notebook_id,
        Notebook.user_id == user_id,
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_notebooks(
    db: AsyncSession,
    user_id: UUID,
    include_archived: bool = False,
) -> tuple[list[Notebook], int]:
    """List notebooks for a user."""
    stmt = select(Notebook).where(Notebook.user_id == user_id)
    
    if not include_archived:
        stmt = stmt.where(Notebook.is_archived == False)
    
    stmt = stmt.order_by(Notebook.updated_at.desc())
    
    result = await db.execute(stmt)
    notebooks = result.scalars().all()
    
    # Count total
    count_stmt = select(func.count()).select_from(Notebook).where(
        Notebook.user_id == user_id
    )
    if not include_archived:
        count_stmt = count_stmt.where(Notebook.is_archived == False)
    
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0
    
    return list(notebooks), total


async def update_notebook(
    db: AsyncSession,
    notebook_id: UUID,
    user_id: UUID,
    data: NotebookUpdate,
) -> Notebook | None:
    """Update a notebook."""
    notebook = await get_notebook(db, notebook_id, user_id)
    if not notebook:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(notebook, key, value)
    
    await db.flush()
    await db.refresh(notebook)
    return notebook


async def delete_notebook(
    db: AsyncSession,
    notebook_id: UUID,
    user_id: UUID,
) -> bool:
    """Delete a notebook."""
    notebook = await get_notebook(db, notebook_id, user_id)
    if not notebook:
        return False
    
    await db.delete(notebook)
    await db.flush()
    return True