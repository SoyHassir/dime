from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import google.generativeai as genai
import os

app = FastAPI()

# --- CONFIGURACIÓN GEMINI AI ---
# API Key de Google Gemini
# IMPORTANTE: La API key debe configurarse como variable de entorno
# En producción, configura GEMINI_API_KEY en Cloud Run
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Usar gemini-2.0-flash que está disponible y es rápido
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
    except:
        # Fallback a gemini-pro si el anterior no funciona
        model = genai.GenerativeModel('gemini-pro')
else:
    model = None
    print("⚠️ GEMINI_API_KEY no configurada. El chat no funcionará hasta configurarla.")

# Memoria Caché para no llamar a SODA en cada chat
contexto_tolu = ""

# --- 1. PERMISOS (CORS) ---
# Configuración de CORS: permite desarrollo local y producción
ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", "")
if ALLOWED_ORIGINS_ENV:
    # Si hay variable de entorno, usar esos orígenes + localhost para desarrollo
    allowed_origins = ALLOWED_ORIGINS_ENV.split(",") + [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
else:
    # Por defecto, permitir todos (desarrollo)
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# --- 2. CONFIGURACIÓN SODA (DATOS ABIERTOS) ---
DATASET_ID = "gi7q-5bgv" 
BASE_URL = f"https://www.datos.gov.co/resource/{DATASET_ID}.json"
API_TOKEN = "CVraNSsLcjWDoVyJlV6LEmEaU"  # Token para autenticación SODA3

class MensajeUsuario(BaseModel):
    pregunta: str

# --- FUNCIÓN DE CARGA DE DATOS PARA IA (ETL) ---
def actualizar_memoria_ia():
    global contexto_tolu
    print("🧠 Entrenando a DIME con datos frescos...")
    try:
        import json
        import os
        
        # Cargar desde archivo local enriquecido
        archivo_enriquecido = "base_datos_enriquecida.json"
        
        if os.path.exists(archivo_enriquecido):
            with open(archivo_enriquecido, 'r', encoding='utf-8') as f:
                datos = json.load(f)
            
            texto = "LISTADO DE ENTIDADES OFICIALES DE SANTIAGO DE TOLÚ:\n\n"
            for item in datos:
                nombre = item.get('infraestructura', 'Entidad')
                cat = item.get('categoria', 'General')
                # Usar direccion_ia (dirección humana) en lugar de zona
                direccion = item.get('direccion_ia', None)
                
                # Formateo inteligente de texto
                def to_title_case(texto):
                    if not texto or not isinstance(texto, str):
                        return texto
                    palabras_minusculas = ['de', 'del', 'la', 'las', 'los', 'el', 'en', 'por', 'para']
                    texto = texto.replace('INSTITUCION EDUCATIVA', 'I.E.').replace('INSTITUCIÓN EDUCATIVA', 'I.E.')
                    palabras = texto.split()
                    resultado = []
                    for i, palabra in enumerate(palabras):
                        palabra_lower = palabra.lower()
                        if palabra_lower == 'tolu':
                            resultado.append('Tolú')
                        elif palabra_lower == 'turistico':
                            resultado.append('Turístico')
                        elif i == 0:
                            resultado.append(palabra.capitalize())
                        elif palabra_lower in palabras_minusculas:
                            resultado.append(palabra_lower)
                        else:
                            resultado.append(palabra.capitalize())
                    return ' '.join(resultado)
                
                nombre_formateado = to_title_case(nombre)
                cat_formateada = to_title_case(cat)
                
                # Formato optimizado para que Gemini lea rápido
                if direccion:
                    texto += f"- {nombre_formateado} ({cat_formateada}). Dirección: {direccion}.\n"
                else:
                    # Si no hay dirección, usar zona como fallback
                    zona = item.get('zona', 'No registrada')
                    texto += f"- {nombre_formateado} ({cat_formateada}). Zona: {zona}.\n"
            
            contexto_tolu = texto
            print(f"✅ DIME memorizó {len(datos)} lugares desde archivo enriquecido.")
        else:
            # Fallback: cargar desde API si no existe el archivo
            print("⚠️ Archivo enriquecido no encontrado, cargando desde API...")
            headers = {
                "X-App-Token": API_TOKEN,
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
            
            params = {
                "$limit": 3000,
                "$where": "coordenadas IS NOT NULL OR geo_loc IS NOT NULL OR (latitud IS NOT NULL AND longitud IS NOT NULL)"
            }
            
            response = requests.get(BASE_URL, params=params, headers=headers)
            response.raise_for_status()
            datos = response.json()
            
            texto = "LISTADO DE ENTIDADES OFICIALES DE SANTIAGO DE TOLÚ:\n\n"
            for item in datos:
                nombre = item.get('infraestructura', 'Entidad').title()
                cat = item.get('categoria', 'General').title()
                zona = item.get('zona', 'No registrada')
                texto += f"- {nombre} ({cat}). Zona: {zona}.\n"
            
            contexto_tolu = texto
            print(f"✅ DIME memorizó {len(datos)} lugares desde API (fallback).")
            
    except Exception as e:
        print(f"❌ Error cargando memoria: {e}")
        contexto_tolu = "Error cargando datos."

# Cargamos datos al iniciar la app
@app.on_event("startup")
async def startup_event():
    actualizar_memoria_ia()

@app.get("/")
def home():
    return {"estado": "DIME Online 🤖", "mensaje": "¡El Cerebro de DIME está vivo! 🧠"}

@app.get("/api/lugares")
def obtener_lugares():
    print("📡 Conectando con datos.gov.co...")
    
    try:
        # Headers con autenticación SODA3
        headers = {
            "X-App-Token": API_TOKEN,
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        # CONSULTA INTELIGENTE (SoQL)
        # Pedimos solo lo que tenga coordenadas para no ensuciar el mapa
        params = {
            "$limit": 5000,
            "$where": "coordenadas IS NOT NULL OR geo_loc IS NOT NULL OR (latitud IS NOT NULL AND longitud IS NOT NULL)"
        }
        
        response = requests.get(BASE_URL, params=params, headers=headers)
        response.raise_for_status()  # Lanza excepción si hay error HTTP
        datos_crudos = response.json()
        
        datos_limpios = []
        
        print(f"✅ Descargados {len(datos_crudos)} registros. Procesando...")

        for index, item in enumerate(datos_crudos):
            # 1. Limpieza de Coordenadas
            lat, lng = None, None
            
            # Intento de extracción de coordenadas (múltiples formatos)
            try:
                # Prioridad 1: geo_loc (GeoJSON Point)
                if 'geo_loc' in item and item['geo_loc'] and 'coordinates' in item['geo_loc']:
                    coords = item['geo_loc']['coordinates']
                    if isinstance(coords, list) and len(coords) >= 2:
                        lng = float(coords[0])  # Longitud primero en GeoJSON
                        lat = float(coords[1])  # Latitud segundo
                
                # Prioridad 2: latitud y longitud (campos separados)
                elif 'latitud' in item and 'longitud' in item:
                    lat = float(item['latitud']) if item['latitud'] else None
                    lng = float(item['longitud']) if item['longitud'] else None
                
                # Prioridad 3: coordenadas (string "lat,lng")
                elif 'coordenadas' in item and item['coordenadas']:
                    parts = str(item['coordenadas']).replace('"', '').replace("'", "").split(',')
                    if len(parts) >= 2:
                        lat = float(parts[0].strip())
                        lng = float(parts[1].strip())
                
                # Validar coordenadas
                if lat is None or lng is None or lat == 0 or lng == 0:
                    continue
                if lat < -90 or lat > 90 or lng < -180 or lng > 180:
                    continue
                    
            except (ValueError, TypeError, KeyError) as e:
                print(f"⚠️ Error procesando coordenadas para item {index}: {e}")
                continue  # Si falla, ignoramos este lugar

            # 2. Formateo inteligente de texto (Title Case)
            def to_title_case(texto):
                if not texto or not isinstance(texto, str):
                    return texto
                
                palabras_minusculas = ['de', 'del', 'la', 'las', 'los', 'el', 'en', 'por', 'para', 
                                     'con', 'sin', 'sobre', 'bajo', 'entre', 'hasta', 'desde']
                
                # Reemplazos especiales
                texto = texto.replace('INSTITUCION EDUCATIVA', 'I.E.').replace('INSTITUCIÓN EDUCATIVA', 'I.E.')
                
                palabras = texto.split()
                resultado = []
                for i, palabra in enumerate(palabras):
                    palabra_lower = palabra.lower()
                    
                    # Correcciones ortográficas
                    if palabra_lower == 'tolu':
                        resultado.append('Tolú')
                        continue
                    elif palabra_lower == 'turistico':
                        resultado.append('Turístico')
                        continue
                    
                    # Primera palabra siempre capitalizada
                    if i == 0:
                        resultado.append(palabra.capitalize())
                    # Artículos/preposiciones en minúsculas
                    elif palabra_lower in palabras_minusculas:
                        resultado.append(palabra_lower)
                    # Resto capitalizado
                    else:
                        resultado.append(palabra.capitalize())
                
                return ' '.join(resultado)
            
            def formatear_zona(zona):
                if not zona or not isinstance(zona, str):
                    return 'Dirección no disponible'
                zona_limpia = zona.strip()
                if zona_limpia:
                    return f"Zona: {zona_limpia.capitalize()}"
                return 'Dirección no disponible'

            # 3. Crear objeto limpio para DIME
            lugar = {
                "id": index + 1,
                "nombre": to_title_case(item.get('infraestructura', 'Sin nombre')),
                "categoria": to_title_case(item.get('categoria', 'Otros')),
                "direccion": formatear_zona(item.get('zona', '')),
                "ubicacion": {"lat": lat, "lng": lng}
            }
            
            datos_limpios.append(lugar)

        return datos_limpios

    except Exception as e:
        print(f"❌ Error: {e}")
        return {"error": "Fallo la conexión con el gobierno"}

@app.post("/api/chat")
async def chat_endpoint(mensaje: MensajeUsuario):
    if not model or not GEMINI_API_KEY:
        return {
            "respuesta": "¡Ay! Falta configurar mi API Key de Google. Por favor, configura GEMINI_API_KEY en el backend."
        }
    
    if not contexto_tolu:
        return {
            "respuesta": "Lo siento, aún estoy cargando la información de Tolú. Intenta en unos segundos."
        }
    
    try:
        # EL PROMPT CON REGLAS DE CONCISIÓN MÁXIMA
        prompt = f"""
        --- ROL Y PERSONALIDAD DE DIME ---

        Tu nombre es DIME, el Asistente Guía Oficial.

        Tu personalidad es: Factual, informativo, profesional y amable.

        Tu ÚNICA FUNCIÓN: Brindar orientación precisa sobre las Entidades Municipales y su ubicación, usando EXCLUSIVAMENTE el Catálogo Territorial.
        
        --- REGLAS ESTRICTAS ---

        1. NUNCA respondas con coordenadas numéricas.

        2. NUNCA hagas promesas sobre la calidad emocional del servicio. Mantente objetivo.

        3. NUNCA uses frases de cierre innecesarias.

        4. **SÉ EXTREMADAMENTE CONCISO Y DIRECTO**. Limita tu respuesta a un MÁXIMO de dos (2) frases y no más de 30 palabras.

        5. Cuando te pregunten por una entidad general (ej: "Alcaldía"), prioriza solo la sede principal o la más relevante (ej: "Palacio Municipal").
        
        --- INFORMACIÓN OFICIAL (TU MEMORIA) ---

        {contexto_tolu[:25000]} 

        -------------------------------------------
        
        Pregunta del ciudadano: {mensaje.pregunta}
        
        Respuesta (debe ser el mensaje final que se le dirá al usuario, máximo 2 frases):

        """
        
        response = model.generate_content(prompt)
        return {"respuesta": response.text}
    
    except Exception as e:
        print(f"❌ Error Gemini: {e}")
        return {"respuesta": "Lo siento, se me fue la señal un momento. ¿Me repites?"}