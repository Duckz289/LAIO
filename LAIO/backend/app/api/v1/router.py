from fastapi import APIRouter
from app.api.v1 import notebooks, vocab_items, reviews, game_sessions

api_router = APIRouter()

api_router.include_router(notebooks.router, prefix="/notebooks", tags=["notebooks"])
api_router.include_router(vocab_items.router, prefix="/vocab-items", tags=["vocab-items"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(game_sessions.router, prefix="/game-sessions", tags=["game-sessions"])