"""
Servicio de lugares.
Lógica de negocio para obtener y formatear entidades municipales.
"""

from typing import Any

from adapters.datos_gov_adapter import DatosGovAdapter
from config import settings
from utils.formatters import to_title_case, formatear_zona


class LugaresService:
    """Obtiene y procesa la lista de lugares de Tolú."""

    def __init__(self):
        self._adapter = DatosGovAdapter(
            base_url=settings.datos_gov_base_url,
            api_token=settings.DATOS_GOV_API_TOKEN,
        )

    def obtener_lugares(self) -> list[dict[str, Any]] | dict[str, str]:
        """
        Obtiene los lugares con coordenadas y los formatea.
        Returns:
            Lista de lugares formateados o dict con error.
        """
        print("[DIME] Conectando con datos.gov.co...")
        try:
            datos_crudos = self._adapter.obtener_entidades_municipales(limit=5000)
            print(f"[OK] Descargados {len(datos_crudos)} registros. Procesando...")
            return self._procesar_lugares(datos_crudos)
        except Exception as e:
            print(f"❌ Error: {e}")
            return {"error": "Fallo la conexion con el gobierno"}

    def _procesar_lugares(self, datos_crudos: list[dict]) -> list[dict[str, Any]]:
        """Procesa los datos crudos y devuelve lugares formateados."""
        datos_limpios = []

        for index, item in enumerate(datos_crudos):
            lat, lng = self._extraer_coordenadas(item, index)
            if lat is None or lng is None:
                continue

            lugar = {
                "id": index + 1,
                "nombre": to_title_case(item.get("infraestructura", "Sin nombre")),
                "categoria": to_title_case(item.get("categoria", "Otros")),
                "direccion": formatear_zona(item.get("zona", "")),
                "ubicacion": {"lat": lat, "lng": lng},
            }
            datos_limpios.append(lugar)

        return datos_limpios

    def _extraer_coordenadas(self, item: dict, index: int) -> tuple[float | None, float | None]:
        """Extrae lat/lng del item en cualquier formato soportado."""
        lat, lng = None, None
        try:
            if "geo_loc" in item and item["geo_loc"] and "coordinates" in item["geo_loc"]:
                coords = item["geo_loc"]["coordinates"]
                if isinstance(coords, list) and len(coords) >= 2:
                    lng = float(coords[0])
                    lat = float(coords[1])

            elif "latitud" in item and "longitud" in item:
                lat = float(item["latitud"]) if item["latitud"] else None
                lng = float(item["longitud"]) if item["longitud"] else None

            elif "coordenadas" in item and item["coordenadas"]:
                parts = str(item["coordenadas"]).replace('"', "").replace("'", "").split(",")
                if len(parts) >= 2:
                    lat = float(parts[0].strip())
                    lng = float(parts[1].strip())

            if lat is None or lng is None or lat == 0 or lng == 0:
                return None, None
            if lat < -90 or lat > 90 or lng < -180 or lng > 180:
                return None, None

            return lat, lng
        except (ValueError, TypeError, KeyError) as e:
            print(f"[WARN] Error procesando coordenadas item {index}: {e}")
            return None, None
