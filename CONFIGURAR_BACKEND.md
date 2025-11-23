# 🔧 Configurar Backend en Cloud Run

## Paso 1: Permitir acceso público (si aún no funciona)

Ejecuta este comando en tu terminal (si tienes gcloud instalado):

```bash
gcloud run services add-iam-policy-binding dime-backend \
  --region=us-south1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

## Paso 2: Agregar variables de entorno

### Opción A: Desde la consola web (Recomendado)

1. Ve a: https://console.cloud.google.com/run/detail/us-south1/dime-backend
2. Click en "Editar e implementar una nueva revisión"
3. Ve a la pestaña "Variables y secretos"
4. Click en "AGREGAR VARIABLE"
5. Agrega:
   - Nombre: `GEMINI_API_KEY`
   - Valor: `tu_api_key_de_google` (obtén tu key en https://aistudio.google.com/app/apikey)
6. Click en "AGREGAR VARIABLE" de nuevo
7. Agrega:
   - Nombre: `ALLOWED_ORIGINS`
   - Valor: `https://dime-ia.web.app,https://dime-ia.firebaseapp.com`
8. Click en "DESPLEGAR"

### Opción B: Desde la línea de comandos

```bash
gcloud run services update dime-backend \
  --region=us-south1 \
  --set-env-vars="GEMINI_API_KEY=tu_api_key_aqui,ALLOWED_ORIGINS=https://dime-ia.web.app,https://dime-ia.firebaseapp.com"
```

## Paso 3: Verificar

Abre en el navegador:
```
https://dime-backend-962715884630.us-south1.run.app
```

Deberías ver: `{"estado": "DIME Online 🤖"}`

## Paso 4: Actualizar Frontend

1. Crea `.env.production` en la raíz:
```env
VITE_BACKEND_URL=https://dime-backend-962715884630.us-south1.run.app
```

2. Redespliega:
```bash
npm run deploy
```

