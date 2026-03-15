"""
Rutas para el dominio de chat.
"""

from fastapi import APIRouter, Request

from models.chat import MensajeUsuario
from models.responses import ChatResponse
from services.chat_service import ChatService

router = APIRouter(tags=["Chat"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Enviar pregunta al chat",
    description="Envia una pregunta a DIME-IA y recibe una respuesta basada en el catalogo territorial de Tolú. Requiere Content-Type: application/json.",
    responses={
        200: {"description": "Respuesta de DIME-IA en texto plano"},
        422: {"description": "Datos de entrada invalidos (pregunta requerida)"},
    },
)
async def chat_endpoint(mensaje: MensajeUsuario, request: Request):
    """Recibe una pregunta y devuelve la respuesta de DIME-IA."""
    chat_service = request.app.state.chat_service
    contexto = request.app.state.contexto
    respuesta = chat_service.responder(mensaje.pregunta, contexto)
    return {"respuesta": respuesta}
