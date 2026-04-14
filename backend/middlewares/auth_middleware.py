"""
Middleware para validar tokens y headers comunes.
Intercepta peticiones y valida Authorization y Content-Type cuando aplica.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from config import settings


# Rutas que NO requieren validacion de token (publicas)
RUTAS_PUBLICAS = {
    "/",
    "/api/lugares",
    "/api/chat",
    "/api/analytics/events",
    "/docs",
    "/redoc",
    "/openapi.json",
}


def _ruta_es_publica(path: str) -> bool:
    """Indica si la ruta es publica (no requiere token)."""
    path_normalizado = path.rstrip("/") or "/"
    if path_normalizado in RUTAS_PUBLICAS:
        return True
    if path_normalizado.startswith("/docs") or path_normalizado.startswith("/redoc"):
        return True
    return False


def _validar_content_type(request: Request) -> str | None:
    """
    Valida Content-Type para peticiones con body (POST, PUT, PATCH).
    Returns: mensaje de error o None si es valido.
    """
    if request.method not in ("POST", "PUT", "PATCH"):
        return None

    content_type = request.headers.get("content-type", "")
    if not content_type:
        return "Header Content-Type requerido"

    # Aceptar application/json
    if "application/json" in content_type:
        return None
    # Aceptar form-urlencoded
    if "application/x-www-form-urlencoded" in content_type:
        return None
    # Aceptar multipart
    if "multipart/form-data" in content_type:
        return None

    return "Content-Type no soportado. Use application/json"


def _validar_token(auth_header: str | None) -> bool:
    """
    Valida el token de API si esta configurado.
    Formato esperado: Bearer <token> o X-API-Key: <token>
    """
    if not settings.API_TOKEN_REQUERIDO:
        return True

    api_token = settings.API_SECRET_TOKEN
    if not api_token:
        return True  # Si no hay token configurado, no validar

    if not auth_header:
        return False

    # Bearer token
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        return token == api_token
    # X-API-Key (alternativo)
    if auth_header.startswith("X-API-Key:"):
        token = auth_header.split(":", 1)[1].strip()
        return token == api_token

    return False


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Valida headers comunes y tokens de API.
    Por defecto las rutas son publicas; activar validacion con API_TOKEN_REQUERIDO.
    """

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # OPTIONS (preflight CORS) siempre permitido
        if request.method == "OPTIONS":
            return await call_next(request)

        # Validar Content-Type para body
        content_error = _validar_content_type(request)
        if content_error:
            return JSONResponse(
                status_code=415,
                content={"error": content_error, "detail": "Content-Type debe ser application/json"},
            )

        # Validar token si la ruta no es publica
        if not _ruta_es_publica(path) and settings.API_TOKEN_REQUERIDO:
            auth = request.headers.get("Authorization") or request.headers.get("X-API-Key")
            if not _validar_token(auth):
                return JSONResponse(
                    status_code=401,
                    content={"error": "No autorizado", "detail": "Token invalido o faltante"},
                )

        return await call_next(request)
