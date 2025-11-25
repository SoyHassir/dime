@echo off
echo Iniciando servidor DIME Backend...
echo.
echo Verificando dependencias...
python -c "import uvicorn" 2>nul || (
    echo ERROR: uvicorn no esta instalado. Ejecuta: pip install -r requirements.txt
    pause
    exit /b 1
)

echo.
echo Cargando variables de entorno desde .env...
if exist .env (
    echo Archivo .env encontrado.
) else (
    echo ADVERTENCIA: Archivo .env no encontrado. El chat no funcionara sin GEMINI_API_KEY.
)

echo.
echo Iniciando servidor en http://localhost:8000
echo Presiona Ctrl+C para detener el servidor
echo.
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

