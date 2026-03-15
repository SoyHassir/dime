"""
Variables de entorno y configuración inicial.
Centraliza toda la configuración para facilitar cambios y testing.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Configuración de la aplicación cargada desde variables de entorno."""

    # API Keys y proveedores externos
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # CORS
    @property
    def allowed_origins(self) -> list[str]:
        env_val = os.getenv("ALLOWED_ORIGINS", "")
        if not env_val:
            return ["*"]
        origins = [o.strip() for o in env_val.split(",") if o.strip()]
        return origins + [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ]

    # Datos.gov.co
    DATOS_GOV_DATASET_ID: str = "gi7q-5bgv"
    DATOS_GOV_API_TOKEN: str = "CVraNSsLcjWDoVyJlV6LEmEaU"
    DATOS_GOV_BARRIOS_DATASET_ID: str = "njk4-ygvk"

    # Archivos locales
    ARCHIVO_ENRIQUECIDO: str = "base_datos_enriquecida.json"

    # API Token (para uso interno y futura apertura a terceros)
    API_SECRET_TOKEN: str = os.getenv("API_SECRET_TOKEN", "")
    API_TOKEN_REQUERIDO: bool = os.getenv("API_TOKEN_REQUERIDO", "false").lower() in ("true", "1", "yes")

    @property
    def datos_gov_base_url(self) -> str:
        return f"https://www.datos.gov.co/resource/{self.DATOS_GOV_DATASET_ID}.json"

    @property
    def datos_gov_barrios_url(self) -> str:
        return f"https://www.datos.gov.co/resource/{self.DATOS_GOV_BARRIOS_DATASET_ID}.json"

    @property
    def gemini_habilitado(self) -> bool:
        return bool(self.GEMINI_API_KEY)


settings = Settings()
