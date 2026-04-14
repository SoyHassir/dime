"""
Esquemas de respuesta para documentacion OpenAPI.
"""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Respuesta del health check."""

    estado: str
    mensaje: str


class ChatResponse(BaseModel):
    """Respuesta del chat con DIME-IA."""

    respuesta: str


class ErrorResponse(BaseModel):
    """Respuesta de error estandarizada."""

    error: str
    detail: str | None = None
