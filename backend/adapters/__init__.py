"""
Adaptadores para proveedores externos.
Centraliza el acceso a APIs y servicios externos.
Si cambias de proveedor, solo modificas estos archivos.
"""

from .gemini_adapter import GeminiAdapter
from .datos_gov_adapter import DatosGovAdapter
from .contexto_repository import ContextoRepository

__all__ = ["GeminiAdapter", "DatosGovAdapter", "ContextoRepository"]
