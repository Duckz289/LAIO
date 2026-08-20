from fastapi import APIRouter
from app.api.v1 import (
    game_sessions,
    learning_sessions,
    notebooks,
    progress,
    reviews,
    vocab_items,
    voice,
)

api_router = APIRouter()

api_router.include_router(notebooks.router, prefix="/notebooks", tags=["notebooks"])
api_router.include_router(vocab_items.router, prefix="/vocab-items", tags=["vocab-items"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(game_sessions.router, prefix="/game-sessions", tags=["game-sessions"])
api_router.include_router(learning_sessions.router, prefix="/learning-sessions", tags=["learning"])
api_router.include_router(progress.router, prefix="/progress", tags=["analytics"])
api_router.include_router(voice.router, prefix="/vocab-items", tags=["vocabulary-audio"])
