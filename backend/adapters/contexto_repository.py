"""
Repositorio para el contexto de la IA.
Centraliza la carga de datos desde archivo JSON o API.
Patrón Repository: abstrae el origen de los datos.
"""

import json
import os
from typing import Optional

from utils.formatters import to_title_case


class ContextoRepository:
    """
    Repositorio que carga el contexto para DIME-IA.
    Prioridad: 1) Archivo enriquecido local, 2) API datos.gov.co
    """

    def __init__(
        self,
        archivo_enriquecido: str,
        datos_gov_adapter,
    ):
        self._archivo_enriquecido = archivo_enriquecido
        self._datos_gov_adapter = datos_gov_adapter

    def cargar_contexto(self) -> str:
        """
        Carga el contexto de Tolú desde la fuente disponible.
        Returns:
            Texto formateado con el listado de entidades para el prompt.
        """
        if os.path.exists(self._archivo_enriquecido):
            return self._cargar_desde_archivo()
        return self._cargar_desde_api()

    def _cargar_desde_archivo(self) -> str:
        """Carga desde base_datos_enriquecida.json."""
        with open(self._archivo_enriquecido, "r", encoding="utf-8") as f:
            datos = json.load(f)

        texto = "LISTADO DE ENTIDADES OFICIALES DE SANTIAGO DE TOLÚ:\n\n"
        for item in datos:
            nombre = item.get("infraestructura", "Entidad")
            cat = item.get("categoria", "General")
            direccion = item.get("direccion_ia", None)
            barrio_detectado = item.get("barrio_detectado", "Zona General")
            tipo_zona = item.get("tipo_zona", "General")

            nombre_formateado = to_title_case(nombre)
            cat_formateada = to_title_case(cat)

            if direccion:
                texto += f"- {nombre_formateado} ({cat_formateada}). Ubicado en {tipo_zona}: {barrio_detectado}. Dirección ref: {direccion}.\n"
            else:
                zona = item.get("zona", "No registrada")
                texto += f"- {nombre_formateado} ({cat_formateada}). Ubicado en {tipo_zona}: {barrio_detectado}. Zona: {zona}.\n"

        return texto

    def _cargar_desde_api(self) -> str:
        """Carga desde API datos.gov.co (fallback)."""
        datos = self._datos_gov_adapter.obtener_entidades_municipales(limit=3000)

        texto = "LISTADO DE ENTIDADES OFICIALES DE SANTIAGO DE TOLÚ:\n\n"
        for item in datos:
            nombre = item.get("infraestructura", "Entidad").title()
            cat = item.get("categoria", "General").title()
            zona = item.get("zona", "No registrada")
            texto += f"- {nombre} ({cat}). Zona: {zona}.\n"

        return texto
