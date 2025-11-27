# DIME - Directorio Interactivo Multimodal Estratégico

<div align="center">

![DIME](frontend/public/dime-icon.png)

**Directorio interactivo de entidades públicas de Santiago de Tolú**

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://www.python.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Run-4285F4?logo=googlecloud)](https://cloud.google.com/run)

</div>

---

## 📖 Descripción

DIME es una **Progressive Web App (PWA)** que funciona como directorio inteligente de entidades públicas del municipio de Santiago de Tolú, Colombia. La aplicación combina un mapa interactivo, un asistente de IA conversacional y capacidades de voz para facilitar el acceso a información municipal de manera intuitiva y accesible.

### Características Principales

- 🗺️ **Mapa Interactivo**: Visualiza todas las entidades municipales en un mapa con marcadores interactivos
- 🤖 **Asistente IA**: Chat conversacional con DIME-IA usando Google Gemini para consultas sobre ubicaciones y servicios
- 🎤 **Voz Integrada**: Entrada y salida de voz (Speech-to-Text y Text-to-Speech) con sonidos estilo Google Voice
- 📍 **Precisión Territorial**: Identifica automáticamente si las entidades están en barrios, corregimientos o veredas
- 📱 **PWA Instalable**: Funciona offline y se puede instalar en dispositivos móviles
- 🐛 **Sistema de Reportes**: Permite a los usuarios reportar errores con categorías predefinidas

---

## 🏗️ Arquitectura

DIME está construido con una arquitectura de **frontend y backend separados**:

```
dime/
├── frontend/              # Aplicación React + Vite (Firebase Hosting)
├── backend/               # API FastAPI (Google Cloud Run)
├── Dockerfile             # Containerización para Cloud Run
├── cloudbuild.yaml        # CI/CD con Google Cloud Build
└── README.md              # Este archivo
```

### Stack Tecnológico

#### Frontend
- **React 19.1.0** - Framework principal
- **Vite 7.0.0** - Build tool y dev server
- **Tailwind CSS 4.1.17** - Framework de estilos
- **Framer Motion 12.23.24** - Animaciones fluidas
- **React Leaflet 5.0.0** - Mapas interactivos
- **Lucide React** - Iconografía moderna
- **vite-plugin-pwa** - Capacidades PWA

#### Backend
- **FastAPI 0.104.1** - Framework web asíncrono
- **Python 3.11** - Lenguaje de programación
- **Google Gemini AI 2.0 Flash** - Modelo de IA conversacional
- **Geopy 2.4.1** - Geocodificación inversa
- **Uvicorn** - Servidor ASGI de alto rendimiento

#### Infraestructura
- **Firebase Hosting** - Hosting del frontend
- **Google Cloud Run** - Backend serverless
- **Google Cloud Build** - CI/CD automatizado
- **Docker** - Containerización

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** 18+ y npm
- **Python** 3.11+
- **Git**
- Cuenta en **Google Cloud Platform** (para backend)
- Cuenta en **Firebase** (para frontend)

### Instalación

#### 1. Clonar el repositorio

```bash
git clone https://github.com/SoyHassir/dime.git
cd dime
```

#### 2. Configurar el Frontend

```bash
cd frontend
npm install
```

Crear archivo `.env.local`:
```env
VITE_BACKEND_URL=http://localhost:8000
```

#### 3. Configurar el Backend

```bash
cd backend
pip install -r requirements.txt
```

Crear archivo `.env`:
```env
GEMINI_API_KEY=tu_api_key_de_google
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

> 💡 **Obtén tu API Key de Google Gemini**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### Desarrollo Local

#### Frontend

```bash
cd frontend
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

#### Backend

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

O usa el script de Windows:
```bash
cd backend
start-dev.bat
```

El backend estará disponible en [http://localhost:8000](http://localhost:8000)

---

## 📦 Despliegue

### Frontend (Firebase Hosting)

```bash
cd frontend
npm run deploy
```

Este comando ejecuta `build` y `firebase deploy --only hosting` automáticamente.

### Backend (Google Cloud Run)

#### Opción A: Desde la Consola Web

1. Ve a [Google Cloud Console - Cloud Run](https://console.cloud.google.com/run)
2. Click en **"CREAR SERVICIO"**
3. Configura:
   - **Nombre**: `dime-backend`
   - **Región**: `us-central1`
   - ✅ **Permitir tráfico no autenticado**
4. Conecta repositorio: `SoyHassir/dime`
5. Configura:
   - **Rama**: `main`
   - **Directorio**: `backend/`
   - **Dockerfile**: `Dockerfile` (en la raíz)
6. **Variables de entorno**:
   - `GEMINI_API_KEY` = `tu_api_key`
   - `ALLOWED_ORIGINS` = `https://dime-ia.web.app,https://dime-ia.firebaseapp.com`
7. Click en **"CREAR"**

#### Opción B: Con Cloud Build (CI/CD)

El proyecto incluye `cloudbuild.yaml` para despliegue automático:

```bash
gcloud builds submit --config cloudbuild.yaml
```

---

## 🎯 Funcionalidades Detalladas

### 1. Mapa Interactivo

- **Tecnología**: React Leaflet + OpenStreetMap
- Visualización de todas las entidades municipales
- Marcadores interactivos
- Vuelo automático al seleccionar una entidad
- Tarjetas informativas con datos detallados

### 2. Asistente de IA (DIME-IA)

- **Modelo**: Google Gemini 2.0 Flash
- Chat conversacional en tiempo real
- Respuestas basadas en datos oficiales del municipio
- Identifica zona rural vs urbana (Corregimientos/Veredas)
- Respuestas concisas (máximo 2 frases, 30 palabras)
- Contexto de 71 entidades municipales

### 3. Sistema de Voz

- **Speech-to-Text (STT)**: Entrada por voz
  - Compatible con Chrome y Safari
  - Idioma: Español Colombia (es-CO)
  - Manejo de errores de permisos para iPhone
  - Sonidos de feedback estilo Google Voice

- **Text-to-Speech (TTS)**: Salida por voz
  - DIME habla sus respuestas cuando la voz está activa
  - Control de volumen integrado
  - Modal persistente durante la interacción

### 4. Precisión Territorial

- **Detección Automática**: Identifica barrios, corregimientos y veredas
- **Dataset Oficial**: Integración con dataset de barrios de Tolú (66 registros)
- **Detección Híbrida**: 
  - Búsqueda por texto en direcciones
  - Geocodificación inversa con OpenStreetMap
- **Información Contextual**: La IA menciona explícitamente si una entidad está en zona rural

### 5. Sistema de Reportes

- **10 Tipos de Errores Predefinidos**:
  - Dirección incorrecta
  - Número de teléfono incorrecto
  - Horario equivocado
  - Nombre de la entidad incorrecto
  - Categoría incorrecta
  - Ubicación en el mapa incorrecta
  - Información desactualizada
  - Entidad ya no existe
  - Barrio o zona incorrecta
  - Otro

- **Mensaje Detallado**: Campo de texto para descripción completa

### 6. Progressive Web App (PWA)

- **Instalable**: Se puede instalar en dispositivos móviles
- **Offline**: Funciona sin conexión gracias al Service Worker
- **Caché Inteligente**: 
  - Precaching de assets estáticos
  - Caché de API (24 horas)
  - Invalidación automática por versión

---

## 📊 Datos y Fuentes

### Datasets Oficiales

1. **Entidades Municipales** (`gi7q-5bgv`)
   - Fuente: [datos.gov.co](https://www.datos.gov.co)
   - 71 entidades procesadas
   - Incluye: coordenadas, categorías, zonas

2. **Barrios de Tolú** (`njk4-ygvk`)
   - Fuente: [datos.gov.co](https://www.datos.gov.co)
   - 66 barrios/corregimientos/veredas
   - Tipos: Barrio, Corregimiento, Vereda

### Base de Datos Enriquecida

El archivo `backend/base_datos_enriquecida.json` contiene:
- Direcciones humanas (geocodificación inversa)
- Barrios/corregimientos/veredas detectados
- Tipos de zona (Barrio/Corregimiento/Vereda/General)
- 48 entidades con ubicación territorial precisa

**Regenerar la base de datos**:
```bash
cd backend
python enriquecer_datos.py
```

---

## 🛠️ Scripts Disponibles

### Frontend

```bash
npm run dev      # Servidor de desarrollo (puerto 5173)
npm run build    # Build de producción
npm run preview  # Preview del build
npm run deploy   # Build + Firebase deploy
npm run lint     # Linter de código
```

### Backend

```bash
# Desarrollo
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Windows
start-dev.bat

# Regenerar base de datos
python enriquecer_datos.py
```

---

## 🔧 Configuración

### Variables de Entorno

#### Frontend (`.env.local`)

```env
VITE_BACKEND_URL=http://localhost:8000
```

#### Backend (`.env`)

```env
GEMINI_API_KEY=tu_api_key_de_google_gemini
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Producción

En **Cloud Run**, configura las variables de entorno:
- `GEMINI_API_KEY`
- `ALLOWED_ORIGINS` (URLs de Firebase Hosting)

---

## 📱 Características PWA

- ✅ **Manifest configurado**: Iconos, tema, display mode
- ✅ **Service Worker**: Caché offline y actualizaciones automáticas
- ✅ **Instalable**: Se puede agregar a la pantalla de inicio
- ✅ **Responsive**: Optimizado para móviles y desktop
- ✅ **Offline**: Funciona sin conexión (con caché)

---

## 🎨 Tecnologías y Librerías

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.1.0 | Framework UI |
| Vite | 7.0.0 | Build tool |
| Tailwind CSS | 4.1.17 | Estilos |
| Framer Motion | 12.23.24 | Animaciones |
| React Leaflet | 5.0.0 | Mapas |
| Lucide React | 0.554.0 | Iconos |
| vite-plugin-pwa | 1.1.0 | PWA |

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| FastAPI | 0.104.1 | Framework web |
| Python | 3.11 | Lenguaje |
| Google Gemini AI | 0.8.5 | IA conversacional |
| Geopy | 2.4.1 | Geocodificación |
| Uvicorn | 0.24.0 | Servidor ASGI |
| python-dotenv | 1.0.0 | Variables de entorno |

---

## 🔐 Seguridad

- ✅ API keys almacenadas en variables de entorno
- ✅ CORS configurado para orígenes específicos
- ✅ Archivos `.env*` ignorados por Git
- ✅ Validación de datos con Pydantic
- ✅ Manejo seguro de errores

---

## 📈 Estadísticas del Proyecto

- **Entidades procesadas**: 71
- **Barrios detectados**: 48
- **Tipos de errores reportables**: 10
- **Idiomas soportados**: Español (es-CO)
- **Modelo de IA**: Gemini 2.0 Flash

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

## 👥 Autor

**Hassir** - [@SoyHassir](https://github.com/SoyHassir)

---

## 🙏 Agradecimientos

- **Google Gemini AI** por el modelo de IA
- **OpenStreetMap** por los datos de geocodificación
- **datos.gov.co** por los datasets oficiales
- **Santiago de Tolú** por los datos municipales

---

<div align="center">

**DIME - Conectando a Tolú con tecnología** 🚀

[Reportar un problema](https://github.com/SoyHassir/dime/issues) · [Solicitar una feature](https://github.com/SoyHassir/dime/issues)

</div>
