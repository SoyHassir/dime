"""
Adaptador para Google Gemini.
Wrapper que desacopla el uso de la API de Gemini.
Si cambias a otro proveedor de IA (OpenAI, Claude, etc.), solo modificas este archivo.
"""

from abc import ABC, abstractmethod
from typing import Optional

# Importación condicional para no fallar si no está configurado
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


class ILLMAdapter(ABC):
    """Interfaz para cualquier proveedor de IA conversacional."""

    @abstractmethod
    def generar_respuesta(self, prompt: str) -> str:
        """Genera una respuesta a partir del prompt."""
        pass

    @abstractmethod
    def esta_disponible(self) -> bool:
        """Indica si el servicio está configurado y disponible."""
        pass


class GeminiAdapter(ILLMAdapter):
    """
    Adaptador para Google Gemini.
    Encapsula la configuración y uso de la API.
    """

    def __init__(self, api_key: str, modelo_principal: str = "gemini-2.0-flash", modelo_fallback: str = "gemini-pro"):
        self._api_key = api_key
        self._modelo_principal = modelo_principal
        self._modelo_fallback = modelo_fallback
        self._model = None
        self._configurado = False

        if api_key and GEMINI_AVAILABLE:
            self._configurar()

    def _configurar(self) -> None:
        """Configura el cliente de Gemini."""
        try:
            genai.configure(api_key=self._api_key)
            try:
                self._model = genai.GenerativeModel(self._modelo_principal)
            except Exception:
                self._model = genai.GenerativeModel(self._modelo_fallback)
            self._configurado = True
        except Exception as e:
            print(f"[WARN] Error configurando Gemini: {e}")
            self._configurado = False

    def generar_respuesta(self, prompt: str) -> str:
        """Genera una respuesta usando el modelo configurado."""
        if not self.esta_disponible():
            raise RuntimeError("Gemini no está configurado. Configura GEMINI_API_KEY.")

        response = self._model.generate_content(prompt)
        return response.text

    def esta_disponible(self) -> bool:
        """Indica si Gemini está configurado y listo para usar."""
        return bool(self._api_key and self._model and self._configurado)
