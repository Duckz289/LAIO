from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.vocab_item import (
    VocabItemCreate,
    VocabItemUpdate,
    VocabItemResponse,
    VocabItemListResponse,
)
from app.services import vocab_service

router = APIRouter()


@router.post("/", response_model=VocabItemResponse, status_code=status.HTTP_201_CREATED)
async def create_vocab_item(
    notebook_id: UUID,
    data: VocabItemCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Create a new vocab item in a notebook."""
    vocab = await vocab_service.create_vocab_item(db, notebook_id, UUID(user_id), data)
    if vocab is None:
        raise HTTPException(status_code=404, detail="Notebook not found")
    return vocab


@router.get("/notebook/{notebook_id}", response_model=VocabItemListResponse)
async def list_vocab_items(
    notebook_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """List all vocab items in a notebook."""
    result = await vocab_service.list_vocab_items(db, notebook_id, UUID(user_id))
    if result is None:
        raise HTTPException(status_code=404, detail="Notebook not found")
    
    items, total = result
    return VocabItemListResponse(vocab_items=items, total=total)


@router.get("/{vocab_id}", response_model=VocabItemResponse)
async def get_vocab_item(
    vocab_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Get a vocab item by ID."""
    vocab = await vocab_service.get_vocab_item(db, vocab_id, UUID(user_id))
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocab item not found")
    return vocab


@router.put("/{vocab_id}", response_model=VocabItemResponse)
async def update_vocab_item(
    vocab_id: UUID,
    data: VocabItemUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Update a vocab item."""
    vocab = await vocab_service.update_vocab_item(db, vocab_id, UUID(user_id), data)
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocab item not found")
    return vocab


@router.delete("/{vocab_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vocab_item(
    vocab_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Delete a vocab item."""
    deleted = await vocab_service.delete_vocab_item(db, vocab_id, UUID(user_id))
    if not deleted:
        raise HTTPException(status_code=404, detail="Vocab item not found")