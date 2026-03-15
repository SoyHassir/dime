# Documentación de la API DIME

## Acceso a la documentación interactiva

- **Swagger UI**: `https://tu-dominio.run.app/docs`
- **ReDoc**: `https://tu-dominio.run.app/redoc`
- **OpenAPI JSON**: `https://tu-dominio.run.app/openapi.json`

En desarrollo local: `http://localhost:8000/docs`

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/api/lugares` | Lista de entidades municipales con coordenadas |
| POST | `/api/chat` | Envía pregunta a DIME-IA |

## Ejemplos

### Health check
```bash
curl http://localhost:8000/
```

### Lugares
```bash
curl http://localhost:8000/api/lugares
```

### Chat
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"pregunta": "¿Dónde está la alcaldía?"}'
```

## Códigos de respuesta

| Código | Significado |
|--------|-------------|
| 200 | OK |
| 401 | No autorizado (token inválido si API_TOKEN_REQUERIDO=true) |
| 415 | Content-Type no soportado (use application/json en POST) |
| 422 | Datos de entrada inválidos |
| 500 | Error interno del servidor |
