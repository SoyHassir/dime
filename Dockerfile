# Dockerfile temporal en la raíz que delega al backend
# Este archivo es solo para Cloud Run
FROM python:3.11-slim

WORKDIR /app

# Copiar requirements e instalar dependencias
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto de los archivos del backend
COPY backend/ .

# Exponer el puerto (Cloud Run usa la variable PORT automáticamente)
EXPOSE 8000

# Comando para iniciar el servidor
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

