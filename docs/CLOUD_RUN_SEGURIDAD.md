# Configuración de Seguridad en Cloud Run

## Variables de entorno

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| GEMINI_API_KEY | API de Google AI Studio | Sí (para chat) |
| ALLOWED_ORIGINS | Orígenes CORS permitidos | No |
| API_SECRET_TOKEN | Token para rutas protegidas | No |
| API_TOKEN_REQUERIDO | true/false para exigir token | No (default: false) |

## Restricciones de red (Ingress)

En `cloudbuild.yaml` puedes configurar `_INGRESS`:

| Valor | Descripción |
|-------|-------------|
| `all` | Permite tráfico desde internet (por defecto para DIME) |
| `internal-and-cloud-load-balancing` | Solo a través de Load Balancer (IAP, Armor, CDN) |
| `internal` | Solo tráfico interno de Google Cloud |

Para DIME (app pública con Firebase Hosting), usa `all`.

## Tokens de API

1. **Generar token**: `cd backend && python -m scripts.generar_token`
2. **Configurar en Cloud Run**: Variables de entorno → `API_SECRET_TOKEN=<token>`
3. **Opcional - exigir token**: `API_TOKEN_REQUERIDO=true` (por defecto `false`)

Cuando `API_TOKEN_REQUERIDO=true`, las rutas no públicas requerirán `Authorization: Bearer <token>` o `X-API-Key: <token>`.

## URLs permitidas (CORS)

Configura `ALLOWED_ORIGINS` en Cloud Run con los dominios del frontend, separados por coma.
