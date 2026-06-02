from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

# Bỏ +asyncpg, dùng postgresql:// thuần
if "+" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split("+")[0] + "://" + DATABASE_URL.split("://")[1]

engine = create_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(engine, autocommit=False, autoflush=False)


def get_db() -> Session:
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()