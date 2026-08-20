"""Small, dependency-free HTTP hardening for the modular monolith."""

from __future__ import annotations

import asyncio
import hashlib
import time
from collections import OrderedDict
from collections.abc import Awaitable, Callable

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Message, Receive, Scope, Send


class RequestBodyLimitMiddleware:
    """Reject oversized bodies before JSON parsing allocates unbounded memory."""

    def __init__(self, app: ASGIApp, max_bytes: int) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope.get("method") not in {
            "POST",
            "PUT",
            "PATCH",
        }:
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        raw_length = headers.get(b"content-length")
        if raw_length:
            try:
                if int(raw_length) > self.max_bytes:
                    await self._reject(scope, receive, send)
                    return
            except ValueError:
                await self._reject(scope, receive, send)
                return

        messages: list[Message] = []
        received = 0
        while True:
            message = await receive()
            messages.append(message)
            if message["type"] == "http.disconnect":
                return
            received += len(message.get("body", b""))
            if received > self.max_bytes:
                await self._reject(scope, receive, send)
                return
            if not message.get("more_body", False):
                break

        async def replay_receive() -> Message:
            if messages:
                return messages.pop(0)
            return {"type": "http.request", "body": b"", "more_body": False}

        await self.app(scope, replay_receive, send)

    @staticmethod
    async def _reject(scope: Scope, receive: Receive, send: Send) -> None:
        response = JSONResponse(
            {"detail": "Request body is too large"},
            status_code=413,
        )
        await response(scope, receive, send)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Bound abuse per bearer token; use a gateway/Redis when multi-instance."""

    def __init__(
        self,
        app: ASGIApp,
        requests_per_minute: int,
        tts_requests_per_minute: int,
        max_clients: int = 10_000,
    ) -> None:
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.tts_requests_per_minute = tts_requests_per_minute
        self.max_clients = max_clients
        self._buckets: OrderedDict[tuple[str, str], tuple[int, int]] = OrderedDict()
        self._lock = asyncio.Lock()

    @staticmethod
    def _client_key(request: Request) -> str:
        authorization = request.headers.get("authorization", "")
        if authorization.lower().startswith("bearer "):
            return hashlib.sha256(authorization.encode("utf-8")).hexdigest()[:24]
        return request.client.host if request.client else "unknown"

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable],
    ):
        path = request.url.path
        if not path.startswith("/api/v1/"):
            return await call_next(request)

        is_tts = path.endswith("/audio") and request.method == "POST"
        group = "tts" if is_tts else "api"
        limit = (
            self.tts_requests_per_minute
            if is_tts
            else self.requests_per_minute
        )
        window = int(time.monotonic() // 60)
        key = (group, self._client_key(request))

        async with self._lock:
            stored_window, count = self._buckets.get(key, (window, 0))
            if stored_window != window:
                count = 0
            count += 1
            self._buckets[key] = (window, count)
            self._buckets.move_to_end(key)
            while len(self._buckets) > self.max_clients:
                self._buckets.popitem(last=False)

        remaining = max(0, limit - count)
        if count > limit:
            return JSONResponse(
                {"detail": "Too many requests. Try again shortly."},
                status_code=429,
                headers={"Retry-After": "60"},
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable],
    ):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault(
            "Permissions-Policy",
            "camera=(), geolocation=(), microphone=()",
        )
        if request.url.path.startswith("/api/v1/"):
            response.headers.setdefault("Cache-Control", "no-store")
        return response
