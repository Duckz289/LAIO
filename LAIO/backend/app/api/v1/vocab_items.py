from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
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
    user_id: UUID = Depends(get_current_user),
):
    vocab = vocab_service.create_vocab_item(db, notebook_id, user_id, data)
    if vocab is None:
        raise HTTPException(status_code=404, detail="Notebook not found")
    return vocab


@router.get("/notebook/{notebook_id}/search", response_model=VocabItemListResponse)
def search_vocab_items(
    notebook_id: UUID,
    q: str = Query(min_length=1, max_length=500),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user),
):
    result = vocab_service.search_vocab_items(
        db, notebook_id, user_id, q, limit, offset
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Notebook not found")
    items, total = result
    return VocabItemListResponse(
        vocab_items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/notebook/{notebook_id}", response_model=VocabItemListResponse)
def list_vocab_items(
    notebook_id: UUID,
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user),
):
    result = vocab_service.list_vocab_items(
        db, notebook_id, user_id, limit, offset
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Notebook not found")
    items, total = result
    return VocabItemListResponse(
        vocab_items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{vocab_id}", response_model=VocabItemResponse)
def get_vocab_item(
    vocab_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user),
):
    vocab = vocab_service.get_vocab_item(db, vocab_id, user_id)
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocab item not found")
    return vocab


@router.put("/{vocab_id}", response_model=VocabItemResponse, deprecated=True)
@router.patch("/{vocab_id}", response_model=VocabItemResponse)
def update_vocab_item(
    vocab_id: UUID,
    data: VocabItemUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user),
):
    vocab = vocab_service.update_vocab_item(db, vocab_id, user_id, data)
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocab item not found")
    return vocab


@router.delete("/{vocab_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vocab_item(
    vocab_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user),
):
    if not vocab_service.delete_vocab_item(db, vocab_id, user_id):
        raise HTTPException(status_code=404, detail="Vocab item not found")
