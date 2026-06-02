from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.review import ReviewSubmit, DueReviewsResponse, ReviewResponse
from app.services import review_service

router = APIRouter()


@router.get("/due", response_model=DueReviewsResponse)
async def get_due_reviews(
    limit: int = Query(default=20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Get vocab items due for review today."""
    items = await review_service.get_due_reviews(db, UUID(user_id), limit)
    return DueReviewsResponse(items=items, total=len(items))


@router.post("/submit", response_model=dict)
async def submit_review(
    data: ReviewSubmit,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Submit a review result."""
    result = await review_service.submit_review(
        db=db,
        user_id=UUID(user_id),
        vocab_item_id=data.vocab_item_id,
        score=data.score,
        review_type=data.review_type,
        time_spent_ms=data.time_spent_ms,
    )
    return result