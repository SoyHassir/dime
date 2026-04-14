"""
Manejo global de errores.
Centraliza las respuestas de error para toda la API.
"""

import traceback
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Captura excepciones no controladas y devuelve respuesta estandarizada."""
    print(f"[ERROR] Excepcion no controlada: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Error interno del servidor",
            "detail": str(exc) if str(exc) else "Error desconocido",
        },
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Captura errores de validacion Pydantic."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Datos de entrada invalidos",
            "detail": exc.errors(),
        },
    )


def register_exception_handlers(app):
    """Registra los manejadores de excepcion en la app."""
    app.add_exception_handler(Exception, global_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
