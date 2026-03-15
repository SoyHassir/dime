"""
Middlewares globales.
CORS, manejo de errores, logging y validación de headers/tokens.
"""

from .error_handler import register_exception_handlers
from .logging_middleware import LoggingMiddleware
from .auth_middleware import AuthMiddleware

__all__ = ["register_exception_handlers", "LoggingMiddleware", "AuthMiddleware"]
