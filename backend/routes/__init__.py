"""
Rutas HTTP.
Solo definen endpoints y delegan la lógica a los servicios.
"""

from fastapi import APIRouter

from .health import router as health_router
from .lugares import router as lugares_router
from .chat import router as chat_router
from .analytics import router as analytics_router


def registrar_rutas(app) -> None:
    """Registra todas las rutas en la aplicación FastAPI."""
    app.include_router(health_router, tags=["health"])
    app.include_router(lugares_router, prefix="/api", tags=["lugares"])
    app.include_router(chat_router, prefix="/api", tags=["chat"])
    app.include_router(analytics_router, prefix="/api", tags=["analytics"])
