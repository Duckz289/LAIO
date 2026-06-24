from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.review import DueReviewsResponse
from app.services import review_service

router = APIRouter()


@router.get("/due", response_model=DueReviewsResponse)
def get_due_reviews(
    limit: int = Query(default=20, ge=1, le=50),
    notebook_id: UUID | None = None,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Get vocab items due for review today."""
    items = review_service.get_due_reviews(
        db, UUID(user_id), limit, notebook_id=notebook_id
    )
    return DueReviewsResponse(items=items, total=len(items))
