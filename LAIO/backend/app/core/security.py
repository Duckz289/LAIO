"""Compatibility exports for authentication dependencies.

New API modules should import from ``app.api.deps``. This module remains only
to avoid breaking older imports during the incremental rework.
"""

from app.api.deps import get_current_user, verify_supabase_token

__all__ = ["get_current_user", "verify_supabase_token"]
