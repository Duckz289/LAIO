from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=5,          # PgBouncer đã quản lý pool, không cần 20
    max_overflow=10,
    pool_timeout=30,
    pool_pre_ping=True,   # Tự kiểm tra connection còn sống
    pool_recycle=300,     # Recycle mỗi 5 phút
)

SessionLocal = sessionmaker(engine, autocommit=False, autoflush=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()