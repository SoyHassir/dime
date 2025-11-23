FROM python:3.11-slim

WORKDIR /app

# Copiar requirements e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto de los archivos
COPY . .

# Exponer el puerto (Cloud Run usa la variable PORT automáticamente)
EXPOSE 8000

# Comando para iniciar el servidor
# Cloud Run proporciona PORT como variable de entorno, usa 8000 por defecto
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

