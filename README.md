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

DIME es una **Progressive Web App (PWA)** que funciona como directorio inteligente de entidades públicas del municipio de Santiago de Tolú, Colombia. La aplicación combina un mapa interactivo, un asistente de IA conversacional y capacidades de voz para facilitar el acceso a la información de manera intuitiva y accesible.

### Características

- 🗺️ Visualiza todas las entidades municipales en un mapa con marcadores interactivos
- 🤖 Chat conversacional con DIME-IA usando Google Gemini para consultas sobre ubicaciones
- 🎤 Entrada y salida de voz (Speech-to-Text y Text-to-Speech) con sonidos de retroalimentación
- 📍 Identifica automáticamente si las entidades están en barrios, corregimientos o veredas
- 📱 Funciona offline y se puede instalar en dispositivos móviles
- 🐛 Permite a los usuarios reportar errores con categorías predefinidas

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

### Stack tecnológico

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

## 🎯 Funcionalidades detalladas

### 1. Mapa interactivo

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

### 3. Voz

- **Speech-to-Text (STT)**: Entrada por voz
  - Compatible con Chrome y Safari
  - Idioma: Español Colombia (es-CO)
  - Manejo de errores de permisos para iPhone
  - Sonidos de feedback

- **Text-to-Speech (TTS)**: Salida por voz
  - DIME habla sus respuestas cuando la voz está activa
  - Control de volumen integrado
  - Modal persistente durante la interacción

### 4. Precisión territorial

- Identifica barrios, corregimientos y veredas
- Integración con dataset de barrios de Tolú (66 registros)
- **Detección Híbrida**: 
  - Búsqueda por texto en direcciones
  - Geocodificación inversa con OpenStreetMap
- La IA menciona explícitamente si una entidad está en zona rural

### 5. Reportes

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

- Campo de texto para descripción completa

### 6. Progressive Web App (PWA)

- Se puede instalar en dispositivos móviles
- unciona sin conexión gracias al Service Worker
- **Caché inteligente**: 
  - Precaching de assets estáticos
  - Caché de API (24 horas)
  - Invalidación automática por versión

---

## 📊 Datos y fuentes

### Datasets

1. **Entidades municipales** (`gi7q-5bgv`)
   - Fuente: [datos.gov.co](https://www.datos.gov.co)
   - 71 entidades procesadas
   - Incluye: coordenadas, categorías, zonas

2. **Barrios de Tolú** (`njk4-ygvk`)
   - Fuente: [datos.gov.co](https://www.datos.gov.co)
   - 66 barrios/corregimientos/veredas
   - Tipos: Barrio, Corregimiento, Vereda

### Base de datos enriquecida

- Direcciones humanas (geocodificación inversa)
- Barrios/corregimientos/veredas detectados
- Tipos de zona (Barrio/Corregimiento/Vereda/General)
- 48 entidades con ubicación territorial precisa

---

## 📱 Características PWA

- ✅ **Manifest configurado**: Iconos, tema, display mode
- ✅ **Service Worker**: Caché offline y actualizaciones automáticas
- ✅ **Instalable**: Se puede agregar a la pantalla de inicio
- ✅ **Responsive**: Optimizado para móviles y desktop
- ✅ **Offline**: Funciona sin conexión (con caché)

---

<div align="center">

**DIME - Conectando a Tolú con tecnología** 🚀

[Reportar un problema](https://github.com/SoyHassir/dime/issues) · [Solicitar una feature](https://github.com/SoyHassir/dime/issues)

</div>
