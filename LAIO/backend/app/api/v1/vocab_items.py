from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.vocab_item import (
    VocabItemCreate, VocabItemUpdate,
    VocabItemResponse, VocabItemListResponse,
)
from app.services import vocab_service

router = APIRouter()


@router.post("/", response_model=VocabItemResponse, status_code=status.HTTP_201_CREATED)
def create_vocab_item(
    notebook_id: UUID,
    data: VocabItemCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    vocab = vocab_service.create_vocab_item(db, notebook_id, UUID(user_id), data)
    if vocab is None:
        raise HTTPException(status_code=404, detail="Notebook not found")
    return vocab


@router.get("/notebook/{notebook_id}/search", response_model=VocabItemListResponse)
def search_vocab_items(
    notebook_id: UUID,
    q: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = vocab_service.search_vocab_items(db, notebook_id, UUID(user_id), q)
    if result is None:
        raise HTTPException(status_code=404, detail="Notebook not found")
    items, total = result
    return VocabItemListResponse(vocab_items=items, total=total)


@router.get("/notebook/{notebook_id}", response_model=VocabItemListResponse)
def list_vocab_items(
    notebook_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = vocab_service.list_vocab_items(db, notebook_id, UUID(user_id))
    if result is None:
        raise HTTPException(status_code=404, detail="Notebook not found")
    items, total = result
    return VocabItemListResponse(vocab_items=items, total=total)


@router.get("/{vocab_id}", response_model=VocabItemResponse)
def get_vocab_item(
    vocab_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    vocab = vocab_service.get_vocab_item(db, vocab_id, UUID(user_id))
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocab item not found")
    return vocab


@router.put("/{vocab_id}", response_model=VocabItemResponse)
def update_vocab_item(
    vocab_id: UUID,
    data: VocabItemUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    vocab = vocab_service.update_vocab_item(db, vocab_id, UUID(user_id), data)
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocab item not found")
    return vocab


@router.delete("/{vocab_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vocab_item(
    vocab_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    if not vocab_service.delete_vocab_item(db, vocab_id, UUID(user_id)):
        raise HTTPException(status_code=404, detail="Vocab item not found")


@router.patch("/{vocab_id}/review", response_model=VocabItemResponse)
def review_vocab_item(
    vocab_id: UUID,
    is_mastered: bool,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    vocab = vocab_service.review_vocab_item(db, vocab_id, UUID(user_id), is_mastered)
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocab item not found")
    return vocab