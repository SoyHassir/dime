from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import google.generativeai as genai
import os
import re
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

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
                # Nuevos campos: barrio_detectado y tipo_zona
                barrio_detectado = item.get('barrio_detectado', 'Zona General')
                tipo_zona = item.get('tipo_zona', 'General')
                
                # Formateo inteligente de texto (usa la misma función de corrección)
                def to_title_case(texto):
                    if not texto or not isinstance(texto, str):
                        return texto
                    
                    # Normalizar: si todo está en mayúsculas, convertir a minúsculas primero
                    texto_original = texto.strip()
                    if texto_original.isupper() and len(texto_original) > 1:
                        texto = texto_original.lower()
                    else:
                        texto = texto_original
                    
                    # Diccionario de correcciones específicas (mismo que en /api/lugares)
                    correcciones = {
                        'I.E. PAULO Freire': 'Institución Educativa Paulo Freire',
                        'Intitucion Educativa JOSE Yemail TOUS - SEDE SAN Isidro': 'Institución Educativa José Yemail Tous - Sede San Isidro',
                        'CDI LA Esperanza DE LOS Niños': 'CDI La Esperanza de los Niños',
                        'Instituto Pedagogico DEL GOLFO': 'Instituto Pedagógico del Golfo',
                        'CASA DE LA Cultura Municipal': 'Casa de la Cultura Municipal',
                        'VILLA Olimpica': 'Villa Olímpica',
                        'Laguna DE Oxidacion': 'Laguna de Oxidación',
                        'Biblioteca Publica Municipal Hector ROJAS Herazo': 'Biblioteca Pública Municipal Héctor Rojas Herazo',
                        'Iglesia Adventista DEL Septimo DIA EL Santuario': 'Iglesia Adventista del Séptimo Día El Santuario',
                        'Estadio DE Futbol': 'Estadio de Fútbol',
                        'CANCA DE Microfutbol VILLA Nazarth': 'Cancha de Microfútbol Villa Nazareth',
                        'Cancha DE Futbol VILLA Nazareth': 'Cancha de Fútbol Villa Nazareth',
                        'Glorieta Entrada DE Tolú': 'Glorieta entrada de Tolú',
                        'Intitucion Educativa JOSE Yemail TOUS - SEDE Alegria': 'Institución Educativa José Yemail Tous - Sede Alegría',
                        'Parque Regional Natural Manglares DE Guacamaya': 'Parque Regional Natural Manglares de Guacamaya',
                        'Intitucion Educativa PITA EN MEDIO - SEDE LAS Cruces': 'Institución Educativa Pita en Medio - Sede Las Cruces',
                        'Intitucion Educativa PITA EN MEDIO - SEDE Principal': 'Institución Educativa Pita en Medio - Sede Principal',
                        'Intitucion Educativa PITA EN MEDIO - SEDE 2': 'Institución Educativa Pita en Medio - Sede 2',
                        'Intitucion Educativa PITA ABAJO SEDE Principal': 'Institución Educativa Pita Abajo - Sede Principal',
                        'Parque Corregimiento PITA ABAJO': 'Parque Corregimiento Pita Abajo',
                        'Cementerio Corregimiento PITA ABAJO': 'Cementerio Corregimiento Pita Abajo',
                        'Intitucion Educativa Educativo NUEVA ERA SEDE Principal': 'Institución Educativa Nueva Era - Sede Principal',
                        'Intitucion Educativa NUEVA ERA SEDE SANTA LUCIA': 'Institución Educativa Nueva Era - Sede Santa Lucía',
                        'Intitucion Educativa NUEVA ERA SEDE Puertas Negras': 'Institución Educativa Nueva Era - Sede Puertas Negras',
                        'Cementerio Corregimiento Puerto VIEJO': 'Cementerio Corregimiento Puerto Viejo',
                        'Estadio DE Softbol Corregimiento Puerto VIEJO': 'Estadio de Sóftbol Corregimiento Puerto Viejo',
                        'Intitucion Educativa Puerto VIEJO SEDE Principal': 'Institución Educativa Puerto Viejo - Sede Principal',
                        'Intitucion Educativa NUEVA ERA SEDE EL Palmar': 'Institución Educativa Nueva Era - Sede El Palmar',
                        'Intitucion Educativa Puerto VIEJO SEDE PALO Blanco': 'Institución Educativa Puerto Viejo - Sede Palo Blanco',
                        'PISTA DE PATINAJE': 'Pista de Patinaje',
                        'PISTA DE PATNAJE': 'Pista de Patinaje',
                    }
                    
                    # Verificar si hay una corrección exacta (tanto original como normalizado)
                    if texto_original in correcciones:
                        return correcciones[texto_original]
                    if texto in correcciones:
                        return correcciones[texto]
                    
                    # Si no hay corrección exacta, aplicar formateo inteligente
                    palabras_minusculas = ['de', 'del', 'la', 'las', 'los', 'el', 'en', 'por', 'para']
                    texto = texto.replace('INSTITUCION EDUCATIVA', 'Institución Educativa').replace('INSTITUCIÓN EDUCATIVA', 'Institución Educativa')
                    texto = texto.replace('Intitucion', 'Institución').replace('INTITUCION', 'Institución')
                    palabras = texto.split()
                    resultado = []
                    for i, palabra in enumerate(palabras):
                        palabra_lower = palabra.lower()
                        if palabra_lower == 'tolu':
                            resultado.append('Tolú')
                        elif palabra_lower == 'turistico':
                            resultado.append('Turístico')
                        elif palabra_lower == 'futbol':
                            resultado.append('Fútbol')
                        elif palabra_lower == 'microfutbol':
                            resultado.append('Microfútbol')
                        elif palabra_lower == 'softbol':
                            resultado.append('Sóftbol')
                        elif palabra_lower == 'pedagogico':
                            resultado.append('Pedagógico')
                        elif palabra_lower == 'oxidacion':
                            resultado.append('Oxidación')
                        elif palabra_lower == 'publica':
                            resultado.append('Pública')
                        elif palabra_lower == 'septimo':
                            resultado.append('Séptimo')
                        elif palabra_lower == 'dia':
                            resultado.append('Día')
                        elif palabra_lower == 'nazarth':
                            resultado.append('Nazareth')
                        elif palabra_lower == 'alegria':
                            resultado.append('Alegría')
                        elif palabra_lower == 'lucia':
                            resultado.append('Lucía')
                        elif palabra_lower == 'canca':
                            resultado.append('Cancha')
                        elif palabra_lower == 'patinaje' or palabra_lower == 'patnaje':
                            resultado.append('Patinaje')
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
                # Nuevo formato: incluye tipo_zona y barrio_detectado
                if direccion:
                    texto += f"- {nombre_formateado} ({cat_formateada}). Ubicado en {tipo_zona}: {barrio_detectado}. Dirección ref: {direccion}.\n"
                else:
                    # Si no hay dirección, usar zona como fallback pero mantener barrio_detectado
                    zona = item.get('zona', 'No registrada')
                    texto += f"- {nombre_formateado} ({cat_formateada}). Ubicado en {tipo_zona}: {barrio_detectado}. Zona: {zona}.\n"
            
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
                
                # Normalizar espacios múltiples a uno solo y trim
                texto_original = re.sub(r'\s+', ' ', texto.strip())
                
                # Diccionario de correcciones específicas (con todas las variaciones posibles)
                correcciones = {
                    'I.E. PAULO Freire': 'Institución Educativa Paulo Freire',
                    'Intitucion Educativa JOSE Yemail TOUS - SEDE SAN Isidro': 'Institución Educativa José Yemail Tous (Sede San Isidro)',
                    'CDI LA Esperanza DE LOS Niños': 'CDI La Esperanza de los Niños',
                    'Instituto Pedagogico DEL GOLFO': 'Instituto Pedagógico del Golfo',
                    'CASA DE LA Cultura Municipal': 'Casa de la Cultura Municipal',
                    'VILLA Olimpica': 'Villa Olímpica',
                    'Laguna DE Oxidacion': 'Laguna de Oxidación',
                    'Biblioteca Publica Municipal Hector ROJAS Herazo': 'Biblioteca Pública Municipal Héctor Rojas Herazo',
                    'Iglesia Adventista DEL Septimo DIA EL Santuario': 'Iglesia Adventista del Séptimo Día El Santuario',
                    'Estadio DE Futbol': 'Estadio de Fútbol',
                    'CANCA DE Microfutbol VILLA Nazarth': 'Cancha de Microfútbol Villa Nazareth',
                    'Cancha DE Futbol VILLA Nazareth': 'Cancha de Fútbol Villa Nazareth',
                    'Glorieta Entrada DE Tolú': 'Glorieta entrada de Tolú',
                    'Intitucion Educativa JOSE Yemail TOUS - SEDE Alegria': 'Institución Educativa José Yemail Tous (Sede Alegría)',
                    'Parque Regional Natural Manglares DE Guacamaya': 'Parque Regional Natural Manglares de Guacamaya',
                    'Intitucion Educativa PITA EN MEDIO - SEDE LAS Cruces': 'Institución Educativa Pita en Medio (Sede Las Cruces)',
                    'Intitucion Educativa PITA EN MEDIO - SEDE Principal': 'Institución Educativa Pita en Medio (Sede Principal)',
                    'Intitucion Educativa PITA EN MEDIO - SEDE 2': 'Institución Educativa Pita en Medio (Sede 2)',
                    'Intitucion Educativa PITA ABAJO SEDE Principal': 'Institución Educativa Pita Abajo (Sede Principal)',
                    'Parque Corregimiento PITA ABAJO': 'Parque Corregimiento Pita Abajo',
                    'Cementerio Corregimiento PITA ABAJO': 'Cementerio Corregimiento Pita Abajo',
                    'Intitucion Educativa Educativo NUEVA ERA SEDE Principal': 'Institución Educativa Nueva Era (Sede Principal)',
                    'Intitucion Educativa NUEVA ERA SEDE SANTA LUCIA': 'Institución Educativa Nueva Era (Sede Santa Lucía)',
                    'Intitucion Educativa NUEVA ERA SEDE Puertas Negras': 'Institución Educativa Nueva Era (Sede Puertas Negras)',
                    'Cementerio Corregimiento Puerto VIEJO': 'Cementerio Corregimiento Puerto Viejo',
                    'Estadio DE Softbol Corregimiento Puerto VIEJO': 'Estadio de Sóftbol Corregimiento Puerto Viejo',
                    'Intitucion Educativa Puerto VIEJO SEDE Principal': 'Institución Educativa Puerto Viejo (Sede Principal)',
                    'Intitucion Educativa NUEVA ERA SEDE EL Palmar': 'Institución Educativa Nueva Era (Sede El Palmar)',
                    'Intitucion Educativa Puerto VIEJO SEDE PALO Blanco': 'Institución Educativa Puerto Viejo (Sede Palo Blanco)',
                    'PISTA DE PATINAJE': 'Pista de Patinaje',
                    'PISTA DE PATNAJE': 'Pista de Patinaje',
                    # Agregar variaciones en mayúsculas/minúsculas para casos comunes
                    'pista de patinaje': 'Pista de Patinaje',
                    'Pista De Patinaje': 'Pista de Patinaje',
                    'PISTA DE PATINAGE': 'Pista de Patinaje',  # Por si hay errores de tipeo
                    # Laboratorio IDTOLÚ
                    'LABORATORIO DE INVESTIGACION Y DESARROLLO DE TOLU - IDTOLU': 'Laboratorio de Investigación y Desarrollo de Tolú - IDTOLÚ',
                    'Laboratorio de Investigacion Y Desarrollo de Tolú - Idtolu': 'Laboratorio de Investigación y Desarrollo de Tolú - IDTOLÚ',
                    'LABORATORIO DE INVESTIGACION Y DESARROLLO DE TOLU - IDTOLÚ': 'Laboratorio de Investigación y Desarrollo de Tolú - IDTOLÚ',
                    'laboratorio de investigacion y desarrollo de tolu - idtolu': 'Laboratorio de Investigación y Desarrollo de Tolú - IDTOLÚ',
                    # Instituto Freinet
                    'INSTITUTO FREINET PRE ESCOLAR Y PRIMARIA': 'Instituto Freinet Pre-Escolar y Primaria',
                    'Instituto Freinet Pre Escolar Y Primaria': 'Instituto Freinet Pre-Escolar y Primaria',
                    'Instituto Freinet Pre-Escolar y Primaria': 'Instituto Freinet Pre-Escolar y Primaria',
                    # Oficina Ambiental
                    'OFICINA AMBIENTAL Y AGROPECUARIA': 'Oficina Ambiental y Agropecuaria',
                    'Oficina Ambiental Y Agropecuaria': 'Oficina Ambiental y Agropecuaria',
                    # CDI La Esperanza (asegurar que "La" tenga mayúscula)
                    'CDI LA ESPERANZA DE LOS NIÑOS': 'CDI La Esperanza de los Niños',
                    'CDI la Esperanza de los Niños': 'CDI La Esperanza de los Niños',
                }
                
                # Verificar si hay una corrección exacta (múltiples formatos)
                # 1. Texto original (normalizado de espacios)
                if texto_original in correcciones:
                    return correcciones[texto_original]
                # 2. Texto en mayúsculas
                if texto_original.upper() in correcciones:
                    return correcciones[texto_original.upper()]
                # 3. Texto en minúsculas
                if texto_original.lower() in correcciones:
                    return correcciones[texto_original.lower()]
                # 4. Texto con title case
                if texto_original.title() in correcciones:
                    return correcciones[texto_original.title()]
                
                # Si todo está en mayúsculas, convertir a minúsculas para procesamiento
                if texto_original.isupper() and len(texto_original) > 1:
                    texto = texto_original.lower()
                else:
                    texto = texto_original
                
                # Si no hay corrección exacta, aplicar formateo inteligente
                # Nota: "y" va en minúsculas, "la" va en minúsculas excepto cuando es primera palabra o después de sigla
                palabras_minusculas = ['de', 'del', 'la', 'las', 'los', 'el', 'en', 'por', 'para', 
                                     'con', 'sin', 'sobre', 'bajo', 'entre', 'hasta', 'desde', 'y', 'o', 'a']
                
                # Lista de siglas conocidas (deben mantenerse en mayúsculas)
                siglas_conocidas = {
                    'cdi': 'CDI',
                    'idtolu': 'IDTOLÚ',
                    'ie': 'I.E.',
                    'i.e.': 'I.E.',
                }
                
                # Reemplazos especiales
                texto = texto.replace('INSTITUCION EDUCATIVA', 'Institución Educativa').replace('INSTITUCIÓN EDUCATIVA', 'Institución Educativa')
                texto = texto.replace('Intitucion', 'Institución').replace('INTITUCION', 'Institución')
                texto = texto.replace('Educativa', 'Educativa')
                texto = texto.replace('investigacion', 'Investigación').replace('INVESTIGACION', 'Investigación')
                
                palabras = texto.split()
                resultado = []
                for i, palabra in enumerate(palabras):
                    palabra_lower = palabra.lower()
                    
                    # Verificar si es una sigla conocida
                    if palabra_lower in siglas_conocidas:
                        resultado.append(siglas_conocidas[palabra_lower])
                        continue
                    
                    # Detectar siglas: palabras cortas (2-6 caracteres) que son solo letras mayúsculas o tienen números
                    # o que empiezan con mayúsculas y son muy cortas
                    es_sigla = False
                    if len(palabra) >= 2 and len(palabra) <= 6:
                        # Si está completamente en mayúsculas y no es una palabra común
                        if palabra.isupper() and palabra_lower not in palabras_minusculas:
                            es_sigla = True
                        # Si tiene números mezclados con letras
                        elif any(c.isdigit() for c in palabra) and any(c.isalpha() for c in palabra):
                            es_sigla = True
                        # Si es muy corta (2-3 caracteres) y está en mayúsculas o title case
                        elif len(palabra) <= 3 and (palabra.isupper() or (palabra[0].isupper() and palabra[1:].islower())):
                            # Verificar que no sea una palabra común
                            if palabra_lower not in palabras_minusculas and palabra_lower not in ['y', 'o', 'a']:
                                es_sigla = True
                    
                    if es_sigla:
                        resultado.append(palabra.upper())
                        continue
                    
                    # Correcciones ortográficas
                    if palabra_lower == 'tolu':
                        resultado.append('Tolú')
                        continue
                    elif palabra_lower == 'turistico':
                        resultado.append('Turístico')
                        continue
                    elif palabra_lower == 'futbol':
                        resultado.append('Fútbol')
                        continue
                    elif palabra_lower == 'microfutbol':
                        resultado.append('Microfútbol')
                        continue
                    elif palabra_lower == 'softbol':
                        resultado.append('Sóftbol')
                        continue
                    elif palabra_lower == 'pedagogico':
                        resultado.append('Pedagógico')
                        continue
                    elif palabra_lower == 'oxidacion':
                        resultado.append('Oxidación')
                        continue
                    elif palabra_lower == 'publica':
                        resultado.append('Pública')
                        continue
                    elif palabra_lower == 'septimo':
                        resultado.append('Séptimo')
                        continue
                    elif palabra_lower == 'dia':
                        resultado.append('Día')
                        continue
                    elif palabra_lower == 'nazarth':
                        resultado.append('Nazareth')
                        continue
                    elif palabra_lower == 'alegria':
                        resultado.append('Alegría')
                        continue
                    elif palabra_lower == 'lucia':
                        resultado.append('Lucía')
                        continue
                    elif palabra_lower == 'viejo':
                        resultado.append('Viejo')
                        continue
                    elif palabra_lower == 'canca':
                        resultado.append('Cancha')
                        continue
                    elif palabra_lower == 'patinaje' or palabra_lower == 'patnaje':
                        resultado.append('Patinaje')
                        continue
                    
                    # Primera palabra siempre capitalizada
                    if i == 0:
                        resultado.append(palabra.capitalize())
                    # "La" después de una sigla (como "CDI La Esperanza") debe ir con mayúscula
                    elif palabra_lower == 'la' and i > 0 and len(resultado) > 0:
                        # Verificar si la palabra anterior es una sigla
                        palabra_anterior = resultado[-1] if resultado else ''
                        # Si la anterior es una sigla (mayúsculas) o es "CDI", capitalizar "La"
                        if palabra_anterior.isupper() or palabra_anterior == 'CDI':
                            resultado.append('La')
                        else:
                            resultado.append('la')
                    # Artículos/preposiciones/conjunciones en minúsculas
                    elif palabra_lower in palabras_minusculas:
                        resultado.append(palabra_lower)
                    # Resto capitalizado
                    else:
                        resultado.append(palabra.capitalize())
                
                texto_formateado = ' '.join(resultado)
                
                # Detectar y encerrar "Sede" entre paréntesis
                # Patrones: " - Sede X", "Sede X" (al final o después de guion)
                # Patrón 1: " - Sede X" → " (Sede X)" (cuando hay guion antes)
                texto_formateado = re.sub(r'\s+-\s+(Sede\s+[^-]+?)(?:\s*-\s*|$)', r' (\1)', texto_formateado)
                # Patrón 2: "Sede X" al final del texto (sin guion antes, pero puede haber espacio)
                texto_formateado = re.sub(r'\s+(Sede\s+[A-Za-z0-9\s]+?)(?:\s*-\s*|$)', r' (\1)', texto_formateado)
                # Limpiar espacios dobles que puedan quedar
                texto_formateado = re.sub(r'\s+', ' ', texto_formateado).strip()
                
                return texto_formateado
            
            def formatear_zona(zona):
                if not zona or not isinstance(zona, str):
                    return 'Dirección no disponible'
                zona_limpia = zona.strip()
                if zona_limpia:
                    # Aplicar formateo inteligente (no solo capitalize)
                    if zona_limpia.upper() == 'URBANA':
                        return 'Zona: Urbana'
                    elif zona_limpia.upper() == 'RURAL':
                        return 'Zona: Rural'
                    else:
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

        6. **IMPORTANTE - PRECISIÓN TERRITORIAL**: 
           - Si una entidad está ubicada en una **Vereda** o **Corregimiento** (zona rural), MENCIONA EXPLÍCITAMENTE esto en tu respuesta. 
           - Ejemplos: "Está ubicada en el Corregimiento de Pita Abajo" o "Se encuentra en la Vereda de...". 
           - Si está en un **Barrio** (zona urbana), puedes mencionarlo pero no es obligatorio.
           - Esto es VITAL para que los ciudadanos sepan si deben desplazarse a zona rural, ya que implica mayor distancia y tiempo de viaje.
        
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