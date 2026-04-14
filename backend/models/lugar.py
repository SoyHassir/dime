"""
Esquemas para el dominio de lugares.
"""

from pydantic import BaseModel


class Ubicacion(BaseModel):
    """Coordenadas geográficas."""

    lat: float
    lng: float


class LugarResponse(BaseModel):
    """Lugar formateado para la API."""

    id: int
    nombre: str
    categoria: str
    direccion: str
    ubicacion: Ubicacion
