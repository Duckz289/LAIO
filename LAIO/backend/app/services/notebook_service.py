from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.core.models.notebook import Notebook
from app.schemas.notebook import NotebookCreate, NotebookUpdate


def create_notebook(db: Session, user_id: UUID, data: NotebookCreate) -> Notebook:
    notebook = Notebook(user_id=user_id, title=data.title, description=data.description)
    db.add(notebook)
    db.flush()
    db.refresh(notebook)
    return notebook


def get_notebook(db: Session, notebook_id: UUID, user_id: UUID) -> Notebook | None:
    return db.scalar(select(Notebook).where(Notebook.id == notebook_id, Notebook.user_id == user_id))


def list_notebooks(db: Session, user_id: UUID, include_archived: bool = False):
    stmt = select(Notebook).where(Notebook.user_id == user_id)
    if not include_archived:
        stmt = stmt.where(Notebook.is_archived == False)
    stmt = stmt.order_by(Notebook.updated_at.desc())
    notebooks = db.scalars(stmt).all()
    
    count_stmt = select(func.count()).select_from(Notebook).where(Notebook.user_id == user_id)
    if not include_archived:
        count_stmt = count_stmt.where(Notebook.is_archived == False)
    total = db.scalar(count_stmt) or 0
    
    return list(notebooks), total


def update_notebook(db: Session, notebook_id: UUID, user_id: UUID, data: NotebookUpdate) -> Notebook | None:
    notebook = get_notebook(db, notebook_id, user_id)
    if not notebook:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(notebook, key, value)
    db.flush()
    db.refresh(notebook)
    return notebook


def delete_notebook(db: Session, notebook_id: UUID, user_id: UUID) -> bool:
    notebook = get_notebook(db, notebook_id, user_id)
    if not notebook:
        return False
    db.delete(notebook)
    db.flush()
    return True