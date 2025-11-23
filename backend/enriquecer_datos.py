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
        
        for i, item in enumerate(datos):
            lat, lng = obtener_coordenadas(item)
            
            if lat is None or lng is None:
                # Si no hay coordenadas válidas, mantener el item sin direccion_ia
                item['direccion_ia'] = None
                datos_enriquecidos.append(item)
                fallidos += 1
                continue
            
            # Geocodificación inversa
            direccion_ia = geocodificar_inversa(lat, lng)
            
            if direccion_ia:
                item['direccion_ia'] = direccion_ia
                exitosos += 1
                print(f"✅ [{i+1}/{len(datos)}] {item.get('infraestructura', 'Sin nombre')[:30]}... → {direccion_ia[:50]}...")
            else:
                item['direccion_ia'] = None
                fallidos += 1
                print(f"⚠️ [{i+1}/{len(datos)}] No se pudo obtener dirección para {item.get('infraestructura', 'Sin nombre')[:30]}...")
            
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
        print(f"   - Archivo guardado: {output_file}")
        
        return datos_enriquecidos
        
    except Exception as e:
        print(f"❌ Error en el proceso: {e}")
        return None

if __name__ == "__main__":
    enriquecer_datos()

