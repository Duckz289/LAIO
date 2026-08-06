from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.services import vbee_service, voice_service

router = APIRouter()


@router.post(
    "/{vocab_id}/audio",
    status_code=status.HTTP_200_OK,
)
async def generate_vocabulary_audio(
    vocab_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user),
):
    try:
        result = await voice_service.generate_vocab_audio(db, vocab_id, user_id)
    except vbee_service.VbeeNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except vbee_service.VbeeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if result is None:
        raise HTTPException(status_code=404, detail="Vocab item not found")
    return Response(
        content=result["audio_bytes"],
        media_type=result["media_type"],
        headers={"Cache-Control": "private, max-age=3600"},
    )
