"""
Script de enriquecimiento de datos para DIME
Realiza geocodificación inversa para obtener direcciones humanas desde coordenadas
"""

import requests
import json
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import time

# Configuración
DATASET_ID = "gi7q-5bgv"
BASE_URL = f"https://www.datos.gov.co/resource/{DATASET_ID}.json"
API_TOKEN = "CVraNSsLcjWDoVyJlV6LEmEaU"

# Dataset de Barrios de Tolú
ID_BARRIOS = "njk4-ygvk"
URL_BARRIOS = f"https://www.datos.gov.co/resource/{ID_BARRIOS}.json?$limit=1000"

# Inicializar geocodificador
geolocator = Nominatim(user_agent="dime-tolu-app")

def obtener_coordenadas(item):
    """Extrae coordenadas de un item en cualquier formato"""
    lat, lng = None, None
    
    try:
        # Prioridad 1: geo_loc (GeoJSON Point)
        if 'geo_loc' in item and item['geo_loc'] and 'coordinates' in item['geo_loc']:
            coords = item['geo_loc']['coordinates']
            if isinstance(coords, list) and len(coords) >= 2:
                lng = float(coords[0])
                lat = float(coords[1])
        
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
            return None, None
        if lat < -90 or lat > 90 or lng < -180 or lng > 180:
            return None, None
            
        return lat, lng
    except:
        return None, None

def descargar_lista_barrios():
    """Descarga la lista oficial de barrios, corregimientos y veredas de Tolú"""
    try:
        headers = {
            "X-App-Token": API_TOKEN,
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        response = requests.get(URL_BARRIOS, headers=headers)
        response.raise_for_status()
        datos = response.json()
        
        lista_barrios = []
        for item in datos:
            nombre = item.get('nombre', '').strip()
            tipo = item.get('tipo', '').strip()
            
            if nombre and tipo:
                # Normalizar nombres y tipos
                nombre_normalizado = nombre.upper().strip()
                tipo_normalizado = tipo.capitalize().strip()
                
                lista_barrios.append({
                    'nombre': nombre_normalizado,
                    'tipo': tipo_normalizado
                })
        
        print(f"✅ Descargados {len(lista_barrios)} barrios/corregimientos/veredas oficiales")
        return lista_barrios
        
    except Exception as e:
        print(f"⚠️ Error descargando lista de barrios: {e}")
        return []

def detectar_barrio_hibrido(lat, lng, direccion_original, lista_barrios_oficial):
    """
    Detecta el barrio/corregimiento/vereda usando dos métodos:
    1. Búsqueda por texto en dirección original
    2. Geocodificación inversa y verificación contra lista oficial
    """
    if not lista_barrios_oficial:
        return "Zona General", "General"
    
    # Intento 1: Búsqueda por texto en dirección original
    if direccion_original:
        direccion_upper = direccion_original.upper()
        for barrio in lista_barrios_oficial:
            nombre_barrio = barrio['nombre']
            # Buscar coincidencia exacta o parcial del nombre del barrio
            if nombre_barrio in direccion_upper or direccion_upper.find(nombre_barrio) != -1:
                return nombre_barrio.title(), barrio['tipo']
    
    # Intento 2: Geocodificación inversa
    try:
        location = geolocator.reverse((lat, lng), timeout=10, language='es')
        if location and location.raw:
            # Buscar en diferentes campos de la respuesta de OpenStreetMap
            address = location.raw.get('address', {})
            
            # Campos posibles donde puede estar el nombre del barrio
            posibles_nombres = [
                address.get('neighbourhood'),
                address.get('village'),
                address.get('suburb'),
                address.get('hamlet'),
                address.get('town'),
            ]
            
            # Verificar si alguno de estos nombres está en la lista oficial
            for nombre_geo in posibles_nombres:
                if nombre_geo:
                    nombre_geo_upper = nombre_geo.upper().strip()
                    for barrio in lista_barrios_oficial:
                        if barrio['nombre'] == nombre_geo_upper or nombre_geo_upper in barrio['nombre']:
                            return barrio['nombre'].title(), barrio['tipo']
            
            # Si no hay coincidencia exacta, intentar búsqueda parcial
            for nombre_geo in posibles_nombres:
                if nombre_geo:
                    nombre_geo_upper = nombre_geo.upper().strip()
                    for barrio in lista_barrios_oficial:
                        if nombre_geo_upper in barrio['nombre'] or barrio['nombre'] in nombre_geo_upper:
                            return barrio['nombre'].title(), barrio['tipo']
    
    except Exception as e:
        print(f"⚠️ Error en geocodificación inversa para detección de barrio: {e}")
    
    # Si no se encontró coincidencia, retornar "Zona General"
    return "Zona General", "General"

def geocodificar_inversa(lat, lng, max_intentos=3):
    """Obtiene dirección humana desde coordenadas"""
    for intento in range(max_intentos):
        try:
            location = geolocator.reverse((lat, lng), timeout=10, language='es')
            if location and location.address:
                return location.address
            time.sleep(1)  # Esperar entre intentos
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            if intento < max_intentos - 1:
                time.sleep(2)  # Esperar más tiempo antes de reintentar
                continue
            print(f"⚠️ Error en geocodificación para ({lat}, {lng}): {e}")
            return None
        except Exception as e:
            print(f"⚠️ Error inesperado en geocodificación: {e}")
            return None
    return None

def enriquecer_datos():
    """Proceso principal de enriquecimiento"""
    print("📡 Obteniendo datos de la API...")
    
    try:
        # Descargar lista oficial de barrios primero
        print("🏘️ Descargando lista oficial de barrios/corregimientos/veredas...")
        lista_barrios_oficial = descargar_lista_barrios()
        
        headers = {
            "X-App-Token": API_TOKEN,
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        params = {
            "$limit": 5000,
            "$where": "coordenadas IS NOT NULL OR geo_loc IS NOT NULL OR (latitud IS NOT NULL AND longitud IS NOT NULL)"
        }
        
        response = requests.get(BASE_URL, params=params, headers=headers)
        response.raise_for_status()
        datos = response.json()
        
        print(f"✅ Obtenidos {len(datos)} registros. Iniciando geocodificación...")
        
        datos_enriquecidos = []
        exitosos = 0
        fallidos = 0
        barrios_detectados = 0
        
        for i, item in enumerate(datos):
            lat, lng = obtener_coordenadas(item)
            
            if lat is None or lng is None:
                # Si no hay coordenadas válidas, mantener el item sin direccion_ia
                item['direccion_ia'] = None
                item['barrio_detectado'] = "Zona General"
                item['tipo_zona'] = "General"
                datos_enriquecidos.append(item)
                fallidos += 1
                continue
            
            # Geocodificación inversa
            direccion_ia = geocodificar_inversa(lat, lng)
            
            if direccion_ia:
                item['direccion_ia'] = direccion_ia
                exitosos += 1
            else:
                item['direccion_ia'] = None
                fallidos += 1
            
            # Detectar barrio/corregimiento/vereda
            barrio_detectado, tipo_zona = detectar_barrio_hibrido(
                lat, lng, 
                item.get('direccion_ia') or item.get('zona', ''),
                lista_barrios_oficial
            )
            
            item['barrio_detectado'] = barrio_detectado
            item['tipo_zona'] = tipo_zona
            
            if barrio_detectado != "Zona General":
                barrios_detectados += 1
            
            if direccion_ia:
                print(f"✅ [{i+1}/{len(datos)}] {item.get('infraestructura', 'Sin nombre')[:30]}... → {direccion_ia[:50]}... | {tipo_zona}: {barrio_detectado}")
            else:
                print(f"⚠️ [{i+1}/{len(datos)}] {item.get('infraestructura', 'Sin nombre')[:30]}... | {tipo_zona}: {barrio_detectado}")
            
            datos_enriquecidos.append(item)
            
            # Pausa para no saturar el servicio de geocodificación
            time.sleep(1)
        
        # Guardar archivo enriquecido
        output_file = "base_datos_enriquecida.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(datos_enriquecidos, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Proceso completado!")
        print(f"📊 Resumen:")
        print(f"   - Total procesados: {len(datos_enriquecidos)}")
        print(f"   - Direcciones obtenidas: {exitosos}")
        print(f"   - Sin dirección: {fallidos}")
        print(f"   - Barrios/corregimientos/veredas detectados: {barrios_detectados}")
        print(f"   - Archivo guardado: {output_file}")
        
        return datos_enriquecidos
        
    except Exception as e:
        print(f"❌ Error en el proceso: {e}")
        return None

if __name__ == "__main__":
    enriquecer_datos()

