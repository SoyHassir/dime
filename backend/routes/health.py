"""
Ruta de health check.
"""

from fastapi import APIRouter

from models.responses import HealthResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/",
    response_model=HealthResponse,
    summary="Health check",
    description="Verifica que el backend este en linea. Retorna estado y mensaje.",
    responses={200: {"description": "Servicio operativo"}},
)
def home():
    """Health check: verifica que el backend este en linea."""
    return {"estado": "DIME Online 🤖", "mensaje": "¡El Cerebro de DIME está vivo! 🧠"}
