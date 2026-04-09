"""
Punto de entrada de la aplicación DIME.
Solo se encarga de:
- Inicializar FastAPI
- Configurar middlewares (CORS, auth, logging, errores)
- Registrar rutas
- Cargar contexto en startup
"""

from fastapi import FastAPI

from config import settings
from config.middleware import configurar_middlewares
from routes import registrar_rutas
from adapters.gemini_adapter import GeminiAdapter
from services.chat_service import ChatService
from services.contexto_service import ContextoService


def create_app() -> FastAPI:
    """Factory para crear la aplicación FastAPI."""
    app = FastAPI(
        title="DIME API",
        description="""
API del asistente DIME (Directorio de Información Municipal de Tolú).

## Endpoints

- **GET /** - Health check del servicio
- **GET /api/lugares** - Lista de entidades municipales con coordenadas
- **POST /api/chat** - Envía una pregunta a DIME-IA y recibe respuesta
- **POST /api/analytics/events** - Ingesta de eventos de uso (lote, hacia Firestore)

## Autenticación

Por defecto la API es pública. Para exigir token, configure `API_TOKEN_REQUERIDO=true` y use el header `Authorization: Bearer <token>` o `X-API-Key: <token>`.
        """,
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Middlewares globales (CORS, auth, logging, manejo de errores)
    configurar_middlewares(app)

    # Inicializar adaptadores y servicios
    gemini_adapter = GeminiAdapter(api_key=settings.GEMINI_API_KEY)
    if not gemini_adapter.esta_disponible():
        print("WARNING: GEMINI_API_KEY no configurada. El chat no funcionara hasta configurarla.")

    app.state.chat_service = ChatService(gemini_adapter=gemini_adapter)
    app.state.contexto_service = ContextoService()

    # Registrar rutas
    registrar_rutas(app)

    @app.on_event("startup")
    async def startup_event():
        """Carga el contexto de Tolú al iniciar."""
        contexto = app.state.contexto_service.actualizar_memoria()
        app.state.contexto = contexto

    return app


app = create_app()
