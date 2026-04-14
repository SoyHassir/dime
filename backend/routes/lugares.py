"""
Rutas para el dominio de lugares.
"""

from fastapi import APIRouter

from models.lugar import LugarResponse
from services.lugares_service import LugaresService

router = APIRouter(tags=["Lugares"])
lugares_service = LugaresService()


@router.get(
    "/lugares",
    response_model=list[LugarResponse],
    summary="Listar lugares",
    description="Obtiene la lista de entidades municipales de Tolú con coordenadas geograficas. Incluye nombre, categoria, direccion y ubicacion (lat/lng).",
    responses={
        200: {"description": "Lista de lugares formateados"},
        500: {"description": "Error de conexion con la fuente de datos"},
    },
)
def obtener_lugares():
    """Obtiene la lista de entidades municipales con coordenadas."""
    resultado = lugares_service.obtener_lugares()
    if isinstance(resultado, dict) and "error" in resultado:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=resultado.get("error", "Error del servidor"))
    return resultado
