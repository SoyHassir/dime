# DIME - Arquitectura del Proyecto

Este repositorio contiene dos componentes principales:

- `frontend/` – Aplicación React + Vite desplegada en Firebase Hosting.
- `backend/` – API FastAPI (Python) desplegada en Google Cloud Run.

```
.
├── backend/                # Código y scripts del backend (FastAPI)
├── frontend/               # Código fuente del frontend (React + Vite)
├── Dockerfile              # Dockerfile raíz utilizado por Cloud Run (copia backend/)
├── cloudbuild.yaml         # Configuración para construir y desplegar el backend
└── README.md               # Este documento
```

## Cómo trabajar con el frontend

```bash
cd frontend
npm install
npm run dev        # Desarrollo local
npm run build      # Build de producción
npm run deploy     # Build + firebase deploy --only hosting
```

> Los archivos de configuración de Firebase, Vite, Tailwind y ESLint viven dentro de `frontend/`.

## Cómo trabajar con el backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

El backend usa variables de entorno:
- `GEMINI_API_KEY`
- `ALLOWED_ORIGINS`

Estas variables deben configurarse en Cloud Run.

## Despliegue rápido

### Backend
- Cloud Build + Cloud Run utilizan `Dockerfile` (en la raíz) que copia `backend/`.

### Frontend
```bash
cd frontend
npm run deploy
```

## Notas
- Los archivos `.env*` están ignorados por Git.
- Los datos enriquecidos (`backend/base_datos_enriquecida.json`) se usan para la IA.
```
