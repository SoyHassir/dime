"""
Middleware de logging para registrar peticiones entrantes.
"""

import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class LoggingMiddleware(BaseHTTPMiddleware):
    """Registra metodo, path, status y tiempo de cada peticion."""

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        method = request.method
        path = request.url.path
        client = request.client.host if request.client else "unknown"

        response = await call_next(request)

        elapsed_ms = (time.perf_counter() - start) * 1000
        status_code = response.status_code
        print(f"[{method}] {path} -> {status_code} | {client} | {elapsed_ms:.1f}ms")

        return response
