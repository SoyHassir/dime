"""
Adaptador para la API de datos.gov.co.
Wrapper que centraliza el acceso a datasets del gobierno.
Si cambias de fuente de datos, solo modificas este archivo.
"""

import requests
from typing import Any


class DatosGovAdapter:
    """
    Adaptador para datos.gov.co.
    Encapsula las llamadas HTTP y el formato de parámetros.
    """

    def __init__(self, base_url: str, api_token: str):
        self._base_url = base_url
        self._api_token = api_token
        self._headers = {
            "X-App-Token": api_token,
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def obtener_entidades_municipales(self, limit: int = 5000) -> list[dict[str, Any]]:
        """
        Obtiene las entidades municipales con coordenadas válidas.
        Returns:
            Lista de registros crudos de la API.
        Raises:
            requests.RequestException: Si falla la conexión.
        """
        params = {
            "$limit": limit,
            "$where": "coordenadas IS NOT NULL OR geo_loc IS NOT NULL OR (latitud IS NOT NULL AND longitud IS NOT NULL)",
        }
        response = requests.get(self._base_url, params=params, headers=self._headers)
        response.raise_for_status()
        return response.json()
