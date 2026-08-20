"""Vocabulary audio use case."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.services import vbee_service, vocab_service


async def generate_vocab_audio(
    db: Session,
    vocab_id: UUID,
    user_id: UUID,
) -> dict | None:
    vocab = vocab_service._get_vocab_entity(db, vocab_id, user_id)
    if vocab is None:
        return None

    audio_bytes, media_type = await vbee_service.synthesize(vocab.word)
    return {
        "audio_bytes": audio_bytes,
        "media_type": media_type,
    }
