from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.notebook import NotebookCreate, NotebookUpdate, NotebookResponse, NotebookListResponse
from app.services import notebook_service

router = APIRouter()


@router.post("/", response_model=NotebookResponse, status_code=status.HTTP_201_CREATED)
def create_notebook(data: NotebookCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    return notebook_service.create_notebook(db, UUID(user_id), data)


@router.get("/", response_model=NotebookListResponse)
def list_notebooks(include_archived: bool = False, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    notebooks, total = notebook_service.list_notebooks(db, UUID(user_id), include_archived)
    return NotebookListResponse(notebooks=notebooks, total=total)


@router.get("/{notebook_id}", response_model=NotebookResponse)
def get_notebook(notebook_id: UUID, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    notebook = notebook_service.get_notebook(db, notebook_id, UUID(user_id))
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")
    return notebook


@router.put("/{notebook_id}", response_model=NotebookResponse)
def update_notebook(notebook_id: UUID, data: NotebookUpdate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    notebook = notebook_service.update_notebook(db, notebook_id, UUID(user_id), data)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")
    return notebook


@router.delete("/{notebook_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notebook(notebook_id: UUID, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    if not notebook_service.delete_notebook(db, notebook_id, UUID(user_id)):
        raise HTTPException(status_code=404, detail="Notebook not found")