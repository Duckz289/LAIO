import sys
import os

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "backend", ".env"))

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ Không đọc được DATABASE_URL")
    sys.exit(1)

print(f"📡 Connecting to: {DATABASE_URL[:60]}...")

try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 10},
    )
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()"))
        print("✅ Kết nối thành công!")
        print(f"   {result.fetchone()[0]}")
except Exception as e:
    print(f"❌ Lỗi: {e}")