"""
Servicio de contexto para DIME-IA.
Gestiona la memoria/catálogo territorial que usa el chat.
"""

from adapters.contexto_repository import ContextoRepository
from adapters.datos_gov_adapter import DatosGovAdapter
from config import settings


class ContextoService:
    """Gestiona la carga y actualización del contexto de Tolú."""

    def __init__(self):
        datos_gov = DatosGovAdapter(
            base_url=settings.datos_gov_base_url,
            api_token=settings.DATOS_GOV_API_TOKEN,
        )
        self._repository = ContextoRepository(
            archivo_enriquecido=settings.ARCHIVO_ENRIQUECIDO,
            datos_gov_adapter=datos_gov,
        )

    def actualizar_memoria(self) -> str:
        """
        Carga el contexto desde la fuente disponible.
        Returns:
            El texto del contexto cargado.
        """
        print("[DIME] Entrenando con datos frescos...")
        try:
            contexto = self._repository.cargar_contexto()
            # Contar líneas aproximadas para el log
            num_entidades = contexto.count("\n- ")
            print(f"[OK] DIME memorizo ~{num_entidades} lugares.")
            return contexto
        except Exception as e:
            print(f"[ERROR] Cargando memoria: {e}")
            return "Error cargando datos."
