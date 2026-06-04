from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1 import vocab_items, notebooks  # import thêm các router khác nếu có

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(notebooks.router, prefix="/api/v1/notebooks", tags=["notebooks"])
app.include_router(vocab_items.router, prefix="/api/v1/vocab-items", tags=["vocab-items"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.VERSION}


@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.APP_NAME} API", "docs": "/docs"}