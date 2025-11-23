/**
 * Servicio para consumir la API de datos.gov.co (SODA3)
 * Endpoint: https://www.datos.gov.co/resource/gi7q-5bgv.json
 * Requiere autenticación con X-App-Token header
 */

// Token de autenticación para la API SODA3
const API_TOKEN = 'CVraNSsLcjWDoVyJlV6LEmEaU';

// URL de la API de datos.gov.co (SODA3)
const API_URL = 'https://www.datos.gov.co/resource/gi7q-5bgv.json';

/**
 * Convierte un texto a Title Case inteligente:
 * - Mantiene siglas en mayúsculas (CDI, I.E., etc.)
 * - Pone artículos/preposiciones en minúsculas (de, del, la, los, etc.)
 * - Capitaliza la primera letra de las demás palabras
 * - Aplica reemplazos especiales (Institución Educativa → I.E.)
 * - Aplica correcciones ortográficas (Tolu → Tolú)
 * @param {string} texto - Texto a convertir
 * @returns {string} - Texto en Title Case inteligente
 */
const toTitleCase = (texto) => {
  if (!texto || typeof texto !== 'string') return texto;
  
  // Reemplazos especiales de frases completas (antes de procesar palabras individuales)
  const reemplazosEspeciales = [
    { 
      patron: /\b(INSTITUCION|INSTITUCIÓN)\s+EDUCATIVA\b/gi, 
      reemplazo: 'I.E.' 
    },
    { 
      patron: /\bINSTITUCION\s+EDUCATIVA\b/gi, 
      reemplazo: 'I.E.' 
    },
    { 
      patron: /\bINSTITUCIÓN\s+EDUCATIVA\b/gi, 
      reemplazo: 'I.E.' 
    }
  ];
  
  // Aplicar reemplazos especiales
  let textoProcesado = texto;
  for (const { patron, reemplazo } of reemplazosEspeciales) {
    textoProcesado = textoProcesado.replace(patron, reemplazo);
  }
  
  // Correcciones ortográficas (se aplicarán durante el procesamiento de palabras)
  const correccionesOrtograficas = {
    'tolu': 'Tolú',
    'turistico': 'Turístico'
  };
  
  // Palabras que deben ir en minúsculas (excepto si son la primera palabra)
  // Incluir todas las variaciones en mayúsculas para asegurar que se conviertan
  const palabrasMinusculas = [
    'de', 'del', 'la', 'las', 'los', 'el', 'en', 'por', 'para', 
    'con', 'sin', 'sobre', 'bajo', 'entre', 'hasta', 'desde', 
    'durante', 'mediante', 'según', 'contra', 'hacia', 'tras',
    'y', 'o', 'a', 'un', 'una', 'unos', 'unas'
  ];
  
  // Detectar siglas (palabras cortas que están completamente en mayúsculas o tienen puntos)
  const esSigla = (palabra) => {
    // Si tiene puntos, probablemente es una sigla (I.E., C.D.I., etc.)
    if (palabra.includes('.')) return true;
    // Si es muy corta (1-4 caracteres) y está en mayúsculas, probablemente es sigla
    if (palabra.length <= 4 && palabra === palabra.toUpperCase() && palabra.length > 1) return true;
    // Si tiene números mezclados con letras mayúsculas, probablemente es sigla
    if (/^[A-Z0-9]+$/.test(palabra) && palabra.length <= 5) return true;
    return false;
  };
  
  return textoProcesado
    .split(' ')
    .filter(palabra => palabra.trim().length > 0) // Filtrar espacios vacíos
    .map((palabra, index) => {
      let palabraOriginal = palabra.trim();
      const palabraLower = palabraOriginal.toLowerCase();
      
      // Aplicar correcciones ortográficas primero (antes de cualquier otra transformación)
      let palabraCorregida = correccionesOrtograficas[palabraLower];
      if (palabraCorregida) {
        // Si hay corrección ortográfica, usarla pero aplicar formato según posición
        if (index === 0) {
          // Primera palabra: mantener la corrección tal cual (ya tiene formato correcto)
          return palabraCorregida;
        } else {
          // No es primera palabra: verificar si es artículo/preposición
          const palabraCorregidaLower = palabraCorregida.toLowerCase();
          if (palabrasMinusculas.includes(palabraCorregidaLower)) {
            return palabraCorregidaLower;
          }
          return palabraCorregida;
        }
      }
      
      // Si es una sigla, mantenerla en mayúsculas
      if (esSigla(palabraOriginal)) {
        return palabraOriginal.toUpperCase();
      }
      
      // Si es la primera palabra, siempre capitalizar (primera letra mayúscula, resto minúsculas)
      if (index === 0) {
        const primeraLetra = palabraOriginal.charAt(0).toUpperCase();
        const resto = palabraOriginal.slice(1).toLowerCase();
        return primeraLetra + resto;
      }
      
      // Si es un artículo/preposición, poner en minúsculas (sin importar cómo venga)
      if (palabrasMinusculas.includes(palabraLower)) {
        return palabraLower;
      }
      
      // Para el resto, capitalizar primera letra y resto en minúsculas
      const primeraLetra = palabraOriginal.charAt(0).toUpperCase();
      const resto = palabraOriginal.slice(1).toLowerCase();
      return primeraLetra + resto;
    })
    .join(' ');
};

/**
 * Formatea la zona para mostrarla correctamente
 * @param {string} zona - Zona (URBANA, RURAL, etc.)
 * @returns {string} - Zona formateada como "Zona: Urbana" o "Zona: Rural"
 */
const formatearZona = (zona) => {
  if (!zona || typeof zona !== 'string') return 'Dirección no disponible';
  
  const zonaFormateada = toTitleCase(zona.trim());
  return `Zona: ${zonaFormateada}`;
};

/**
 * Transforma los datos de la API al formato que usa la aplicación
 * @param {Array} datos - Datos crudos de la API
 * @returns {Array} - Datos transformados
 */
const transformarDatos = (datos) => {
  if (!datos || !Array.isArray(datos)) {
    return [];
  }

  let validos = 0;
  let invalidos = 0;
  
  const lugaresTransformados = datos.map((item, index) => {
    // Extraer coordenadas según la estructura real de la API
    // La BD tiene: latitud (Número), longitud (Número)
    let lat = null;
    let lng = null;
    
    // Intentar obtener de latitud y longitud (pueden ser número o string)
    if (item.latitud !== undefined && item.latitud !== null && 
        item.longitud !== undefined && item.longitud !== null) {
      lat = typeof item.latitud === 'string' ? parseFloat(item.latitud) : Number(item.latitud);
      lng = typeof item.longitud === 'string' ? parseFloat(item.longitud) : Number(item.longitud);
    } else if (item.coordenadas) {
      // También puede venir como string "lat,lng"
      const coords = item.coordenadas.split(',');
      lat = parseFloat(coords[0]);
      lng = parseFloat(coords[1]);
    } else if (item.geo_loc && item.geo_loc.coordinates && Array.isArray(item.geo_loc.coordinates)) {
      // O desde geo_loc: [longitud, latitud] (formato GeoJSON)
      lng = typeof item.geo_loc.coordinates[0] === 'string' 
        ? parseFloat(item.geo_loc.coordinates[0]) 
        : Number(item.geo_loc.coordinates[0]);
      lat = typeof item.geo_loc.coordinates[1] === 'string' 
        ? parseFloat(item.geo_loc.coordinates[1]) 
        : Number(item.geo_loc.coordinates[1]);
    }

    // Validar que las coordenadas sean válidas y estén en un rango razonable
    // Latitud válida: entre -90 y 90
    // Longitud válida: entre -180 y 180
    // Para Tolú, aproximadamente: lat ~9.5, lng ~-75.5
    if (isNaN(lat) || isNaN(lng) || 
        lat === 0 || lng === 0 ||
        lat === null || lng === null ||
        lat < -90 || lat > 90 ||
        lng < -180 || lng > 180) {
      invalidos++;
      return null;
    }
    
    validos++;

    const nombreFormateado = item.infraestructura ? toTitleCase(item.infraestructura) : 'Sin nombre';
    const categoriaFormateada = item.categoria ? toTitleCase(item.categoria) : 'Otros';
    
    return {
      id: index + 1,
      nombre: nombreFormateado,
      categoria: categoriaFormateada,
      ubicacion: {
        lat: lat,
        lng: lng
      },
      direccion: formatearZona(item.zona)
    };
  }).filter(item => {
    // Filtro adicional para asegurar que el item y sus coordenadas sean válidas
    const esValido = item !== null && 
           item.ubicacion && 
           typeof item.ubicacion.lat === 'number' && 
           typeof item.ubicacion.lng === 'number' &&
           !isNaN(item.ubicacion.lat) && 
           !isNaN(item.ubicacion.lng);
    
    if (!esValido && item) {
      invalidos++;
    }
    
    return esValido;
  });
  
  return lugaresTransformados;
};

/**
 * Obtiene los lugares desde la API de datos.gov.co
 * @returns {Promise<Array>} - Array de lugares transformados
 */
export const obtenerLugares = async () => {
  try {
    // Configurar headers con autenticación SODA3
    const headers = {
      'X-App-Token': API_TOKEN,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    // URL con límite para obtener todos los registros
    const urlConLimite = `${API_URL}?$limit=5000`;
    
    const response = await fetch(urlConLimite, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener datos: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // La API devuelve directamente un array de objetos
    let lugares = [];
    
    if (Array.isArray(data)) {
      lugares = data;
    } else if (data.data && Array.isArray(data.data)) {
      lugares = data.data;
    } else {
      return [];
    }

    const lugaresTransformados = transformarDatos(lugares);
    return lugaresTransformados;
  } catch (error) {
    // En caso de error, retornar array vacío o datos de fallback
    throw error; // Lanzar el error para que el componente pueda manejarlo
  }
};

/**
 * Obtiene los lugares con caché (para evitar múltiples llamadas)
 * @param {number} cacheTime - Tiempo de caché en milisegundos (default: 5 minutos)
 * @returns {Promise<Array>} - Array de lugares transformados
 */
export const obtenerLugaresConCache = async (cacheTime = 5 * 60 * 1000) => {
  // Versión del caché - cambiar esto invalida el caché anterior
  const CACHE_VERSION = 'v4';
  const cacheKey = `dime-lugares-cache-${CACHE_VERSION}`;
  const cacheTimestampKey = `dime-lugares-cache-timestamp-${CACHE_VERSION}`;
  
  // Limpiar cachés antiguos (versiones anteriores)
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dime-lugares-cache') && !key.includes(CACHE_VERSION)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    // Error al limpiar cachés antiguos - ignorar silenciosamente
  }
  
  // Verificar si hay datos en caché
  const cachedData = localStorage.getItem(cacheKey);
  const cachedTimestamp = localStorage.getItem(cacheTimestampKey);
  
  if (cachedData && cachedTimestamp) {
    const now = Date.now();
    const cacheAge = now - parseInt(cachedTimestamp);
    
    if (cacheAge < cacheTime) {
      // Los datos en caché son válidos
      return JSON.parse(cachedData);
    }
  }
  
  // Obtener datos frescos de la API
  try {
    const lugares = await obtenerLugares();
    
    // Guardar en caché solo si hay datos
    if (lugares.length > 0) {
      localStorage.setItem(cacheKey, JSON.stringify(lugares));
      localStorage.setItem(cacheTimestampKey, Date.now().toString());
    }
    
    return lugares;
  } catch (error) {
    // Si hay error y hay caché, intentar usar el caché aunque esté expirado
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    throw error;
  }
};

