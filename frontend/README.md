# DIME - Asistente Inteligente de la Alcaldía de Santiago de Tolú

DIME es una aplicación web que proporciona información sobre las entidades municipales y servicios públicos de Santiago de Tolú, con un asistente de IA integrado.

## 🚀 Características

- **Mapa Interactivo**: Visualiza todas las entidades municipales en un mapa
- **Asistente IA**: Chat con DIME-IA para consultas sobre ubicaciones y servicios
- **Información Detallada**: Tarjetas informativas con datos de cada entidad
- **Diseño Responsive**: Optimizado para móviles y desktop
- **Onboarding**: Guía inicial para nuevos usuarios

## 🛠️ Tecnologías

### Frontend
- React + Vite
- Tailwind CSS v4
- Framer Motion (animaciones)
- React Leaflet (mapas)
- Lucide React (iconos)

### Backend
- FastAPI (Python)
- Google Gemini AI
- Geopy (geocodificación)

## 📦 Instalación

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

## 🚀 Despliegue

### Frontend (Firebase Hosting)

```bash
npm run deploy
```

O manualmente:
```bash
npm run build
firebase deploy --only hosting
```

### Backend (Google Cloud Run)

#### Opción A: Desde la Consola Web (Recomendado)

1. Ve a: https://console.cloud.google.com/run
2. Click en "CREAR SERVICIO"
3. Configura:
   - **Nombre**: `dime-backend`
   - **Región**: `us-central1`
   - ✅ **Permitir tráfico no autenticado**
4. Conecta repositorio: `SoyHassir/dime`
5. Configura:
   - **Rama**: `main`
   - **Directorio**: `backend/` ⚠️ (con barra al final)
   - **Dockerfile**: `Dockerfile` ⚠️ (solo el nombre, sin `backend/`)
6. Variables de entorno:
   - `GEMINI_API_KEY` = `tu_api_key_de_google` (obtén tu key en https://aistudio.google.com/app/apikey)
   - `ALLOWED_ORIGINS` = `https://dime-ia.web.app,https://dime-ia.firebaseapp.com`
7. Click en "CREAR"

#### Opción B: Desde la Línea de Comandos

```bash
gcloud run deploy dime-backend \
  --source ./backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=tu_api_key_aqui,ALLOWED_ORIGINS=https://dime-ia.web.app,https://dime-ia.firebaseapp.com"
```

### Actualizar Frontend con URL del Backend

Una vez desplegado el backend:

1. Crea `.env.production` en la raíz:
```env
VITE_BACKEND_URL=https://tu-backend-url.run.app
```

2. Redespliega:
```bash
npm run deploy
```

## 📝 Variables de Entorno

### Frontend
- `VITE_BACKEND_URL`: URL del backend desplegado

### Backend
- `GEMINI_API_KEY`: API Key de Google Gemini
- `ALLOWED_ORIGINS`: Orígenes permitidos para CORS

## 📄 Licencia

Este proyecto es propiedad de la Alcaldía de Santiago de Tolú.

