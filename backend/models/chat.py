"""
Esquemas para el dominio de chat.
"""

from pydantic import BaseModel, Field


class MensajeUsuario(BaseModel):
    """Mensaje enviado por el usuario al chat."""

    pregunta: str = Field(..., description="Texto de la pregunta para DIME-IA", min_length=1)
