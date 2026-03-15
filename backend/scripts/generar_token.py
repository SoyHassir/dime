"""
Script para generar un token de API.
Ejecutar desde backend/: python -m scripts.generar_token
Copiar el resultado en .env como API_SECRET_TOKEN=...
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import secrets

if __name__ == "__main__":
    token = secrets.token_urlsafe(32)
    print("Token generado (copiar a .env como API_SECRET_TOKEN):")
    print(token)
