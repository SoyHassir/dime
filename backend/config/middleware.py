"""
Configuracion centralizada de middlewares.
CORS, orden de ejecucion, etc.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from middlewares import LoggingMiddleware, AuthMiddleware, register_exception_handlers


def configurar_middlewares(app: FastAPI) -> None:
    """
    Registra todos los middlewares en el orden correcto.
    El ultimo registrado es el primero en ejecutarse (envoltura).
    Orden: CORS -> Auth -> Logging -> rutas
    """
    # 1. CORS (debe estar antes para preflight)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # 2. Auth (validacion de headers/tokens)
    app.add_middleware(AuthMiddleware)

    # 3. Logging (registra todas las peticiones)
    app.add_middleware(LoggingMiddleware)

    # 4. Manejo global de errores
    register_exception_handlers(app)
