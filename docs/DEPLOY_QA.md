# Despliegue del entorno QA (Firebase Hosting – canal de vista previa)

El frontend QA se publica en un **canal de vista previa** (`qa-preview`) sin sustituir el sitio de producción. Los canales de vista previa caducan; si hace falta uno nuevo, cambia el id en `package.json` (`deploy:qa`) y vuelve a desplegar.

## Requisitos

- [Firebase CLI](https://firebase.google.com/docs/cli) instalado: `npm install -g firebase-tools`
- Sesión iniciada: `firebase login`
- Proyecto Firebase: `dime-ia` (definido en `.firebaserc` en la raíz del repo)

## 1. URL del backend (Cloud Run)

El build debe conocer la API **pública** (Cloud Run). **No uses `localhost`**: en el navegador, `localhost` es el PC del usuario, no tu servidor; por eso el chat falla con `ERR_CONNECTION_REFUSED`.

**Importante (orden de Vite):** `.env.local` **pisa** a `.env.qa`. Si en `.env.local` tienes `VITE_BACKEND_URL=http://localhost:8001`, el build de QA seguirá apuntando a localhost.

Opciones (elige una):

1. **Quitar** `VITE_BACKEND_URL` de `.env.local` (o comentarla) antes de `npm run build:qa`.
2. Crear **`frontend/.env.qa.local`** (máxima prioridad) con solo:

```env
VITE_BACKEND_URL=https://TU-SERVICIO-XXXXX.run.app
```

(Obtén la URL en Cloud Run → servicio `dime-backend` → URL.)

También puedes usar **`frontend/.env.qa`** si no usas `VITE_BACKEND_URL` en `.env.local`.

El comando `npm run build:qa` **fallará** si la URL final sigue vacía o es localhost (validación en `vite.config.js`).

## 2. CORS en el backend

Las URLs de vista previa tienen forma:

`https://dime-ia--qa-preview-<hash>.web.app`

Tras el **primer** despliegue del canal, Firebase mostrará la URL. Añádela a la variable de entorno **`ALLOWED_ORIGINS`** del servicio Cloud Run (junto a las URLs de producción), separada por comas.

Ejemplo:

```text
https://dime-ia.web.app,https://dime-ia.firebaseapp.com,https://dime-ia--qa-preview-xxxxx.web.app
```

Sin esto, el navegador bloqueará las llamadas al API desde la URL de QA.

## 3. Desplegar el canal QA

Desde la carpeta **`frontend`**:

```bash
npm install
npm run deploy:qa
```

Equivale a:

```bash
npm run build:qa
firebase hosting:channel:deploy qa-preview
```

La CLI imprimirá la **URL de vista previa** para compartir.

## 4. Rama de código

Trabaja y fusiona en la rama **`qa`** (o `develop` → `qa` según tu flujo) antes de construir, para que el build refleje el código que quieras probar.

## Notas

- La URL de vista previa es **pública** para quien tenga el enlace.
- Las apps en esa URL usan los recursos del **mismo proyecto Firebase** que configuraste (según documentación de Firebase).
- Para actualizar QA, vuelve a ejecutar `npm run deploy:qa` tras cambiar código o `.env.qa`.
