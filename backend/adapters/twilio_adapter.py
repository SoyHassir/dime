"""
Adaptador placeholder para Twilio.
Cuando integres SMS o llamadas, implementa este adaptador.
Si cambias de proveedor (Twilio, Vonage, etc.), solo modificas este archivo.
"""

from abc import ABC, abstractmethod


class ITelefoniaAdapter(ABC):
    """Interfaz para proveedores de telefonía/SMS."""

    @abstractmethod
    def enviar_sms(self, numero: str, mensaje: str) -> bool:
        """Envía un SMS al número indicado."""
        pass

    @abstractmethod
    def esta_disponible(self) -> bool:
        """Indica si el servicio está configurado."""
        pass


class TwilioAdapter(ITelefoniaAdapter):
    """
    Adaptador para Twilio.
    TODO: Implementar cuando se integre el servicio de SMS/llamadas.
    """

    def __init__(self, account_sid: str = "", auth_token: str = ""):
        self._account_sid = account_sid
        self._auth_token = auth_token

    def enviar_sms(self, numero: str, mensaje: str) -> bool:
        """Envía un SMS. Pendiente de implementación."""
        raise NotImplementedError("Twilio no configurado. Implementar cuando se integre.")

    def esta_disponible(self) -> bool:
        """Indica si Twilio está configurado."""
        return bool(self._account_sid and self._auth_token)
