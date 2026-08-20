import asyncio
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.api import deps
from app.core.middleware import RateLimitMiddleware


def test_rate_limit_is_enforced_per_bearer_token() -> None:
    app = FastAPI()
    app.add_middleware(
        RateLimitMiddleware,
        requests_per_minute=1,
        tts_requests_per_minute=1,
    )

    @app.get("/api/v1/test")
    def endpoint():
        return {"ok": True}

    client = TestClient(app)
    headers = {"Authorization": "Bearer test-token"}

    assert client.get("/api/v1/test", headers=headers).status_code == 200
    limited = client.get("/api/v1/test", headers=headers)
    assert limited.status_code == 429
    assert limited.headers["retry-after"] == "60"


def test_local_jwt_verification_requires_project_issuer(monkeypatch) -> None:
    secret = "test-secret-that-is-long-enough-for-a-test-token"
    project_url = "https://project.supabase.co"
    monkeypatch.setattr(deps.settings, "SUPABASE_JWT_SECRET", secret)
    monkeypatch.setattr(deps.settings, "SUPABASE_URL", project_url)
    payload = {
        "sub": str(uuid4()),
        "aud": "authenticated",
        "iss": f"{project_url}/auth/v1",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
    }
    token = jwt.encode(payload, secret, algorithm="HS256")

    verified = asyncio.run(deps.verify_supabase_token(token))

    assert verified["sub"] == payload["sub"]


def test_local_jwt_verification_rejects_wrong_issuer(monkeypatch) -> None:
    secret = "test-secret-that-is-long-enough-for-a-test-token"
    monkeypatch.setattr(deps.settings, "SUPABASE_JWT_SECRET", secret)
    monkeypatch.setattr(deps.settings, "SUPABASE_URL", "https://project.supabase.co")
    token = jwt.encode(
        {
            "sub": str(uuid4()),
            "aud": "authenticated",
            "iss": "https://attacker.example/auth/v1",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
        secret,
        algorithm="HS256",
    )

    with pytest.raises(HTTPException) as raised:
        asyncio.run(deps.verify_supabase_token(token))

    assert raised.value.status_code == 401
