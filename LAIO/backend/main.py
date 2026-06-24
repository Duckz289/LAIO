"""Compatibility entrypoint.

The canonical application lives in ``app.main``. Keeping this module lets older
commands such as ``uvicorn main:app`` continue to work without maintaining a
second, incomplete FastAPI application.
"""

from app.main import app

__all__ = ["app"]
