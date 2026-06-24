from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.progress import ProgressSummaryResponse
from app.services.analytics_service import get_progress_summary

router = APIRouter()


@router.get("/summary", response_model=ProgressSummaryResponse)
def progress_summary(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    return get_progress_summary(db, UUID(user_id))
