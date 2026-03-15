"""
Servicio de autenticacion y tokens API.
Generacion y validacion de tokens para uso interno y terceros.
"""

import secrets
from config import settings


def generar_token_api() -> str:
    """
    Genera un token seguro para la API.
    Usar para configurar API_SECRET_TOKEN en .env o Cloud Run.
    """
    return secrets.token_urlsafe(32)


def validar_token(token: str | None) -> bool:
    """Valida que el token coincida con el configurado."""
    if not settings.API_SECRET_TOKEN:
        return True
    return bool(token and token == settings.API_SECRET_TOKEN)


def token_requerido() -> bool:
    """Indica si la API requiere token para las rutas protegidas."""
    return settings.API_TOKEN_REQUERIDO
