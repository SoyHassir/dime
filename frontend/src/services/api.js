/**
 * Servicio para obtener lugares desde el backend de DIME o API directa
 * Prioridad: Backend local → API directa datos.gov.co
 */

// URL del backend de DIME (usa variable de entorno en producción)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api/lugares';

// Token de autenticación para la API SODA3 (fallback)
const API_TOKEN = 'CVraNSsLcjWDoVyJlV6LEmEaU';

// URL de la API de datos.gov.co (SODA3) - Fallback
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
  
  // Normalizar espacios múltiples a uno solo
  const textoNormalizado = texto.replace(/\s+/g, ' ').trim();
  
  // Diccionario de correcciones específicas (igual que en el backend)
  const correcciones = {
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
    'pista de patinaje': 'Pista de Patinaje',
    'Pista De Patinaje': 'Pista de Patinaje',
    'PISTA DE PATINAGE': 'Pista de Patinaje',
    // Laboratorio IDTOLÚ
    'LABORATORIO DE INVESTIGACION Y DESARROLLO DE TOLU - IDTOLU': 'Laboratorio de Investigación y Desarrollo de Tolú - IDTOLÚ',
    'Laboratorio de Investigacion Y Desarrollo de Tolú - Idtolu': 'Laboratorio de Investigación y Desarrollo de Tolú - IDTOLÚ',
    'LABORATORIO DE INVESTIGACION Y DESARROLLO DE TOLU - IDTOLÚ': 'Laboratorio de Investigación y Desarrollo de Tolú - IDTOLÚ',
    'laboratorio de investigacion y desarrollo de tolu - idtolu': 'Laboratorio de Investigación y Desarrollo de Tolú - IDTOLÚ',
    // Instituto Freinet
    'INSTITUTO FREINET PRE ESCOLAR Y PRIMARIA': 'Instituto Freinet Pre-Escolar y Primaria',
    'Instituto Freinet Pre Escolar Y Primaria': 'Instituto Freinet Pre-Escolar y Primaria',
    'Instituto Freinet Pre-Escolar y Primaria': 'Instituto Freinet Pre-Escolar y Primaria',
    // Oficina Ambiental
    'OFICINA AMBIENTAL Y AGROPECUARIA': 'Oficina Ambiental y Agropecuaria',
    'Oficina Ambiental Y Agropecuaria': 'Oficina Ambiental y Agropecuaria',
    // CDI La Esperanza (asegurar que "La" tenga mayúscula)
    'CDI LA ESPERANZA DE LOS NIÑOS': 'CDI La Esperanza de los Niños',
    'CDI la Esperanza de los Niños': 'CDI La Esperanza de los Niños',
  };
  
  // Verificar correcciones en múltiples formatos
  if (textoNormalizado in correcciones) {
    return correcciones[textoNormalizado];
  }
  if (textoNormalizado.toUpperCase() in correcciones) {
    return correcciones[textoNormalizado.toUpperCase()];
  }
  if (textoNormalizado.toLowerCase() in correcciones) {
    return correcciones[textoNormalizado.toLowerCase()];
  }
  // Title case manual (primera letra mayúscula, resto minúsculas por palabra)
  const textoTitleCase = textoNormalizado
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
    .join(' ');
  if (textoTitleCase in correcciones) {
    return correcciones[textoTitleCase];
  }
  
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
  let textoProcesado = textoNormalizado;
  for (const { patron, reemplazo } of reemplazosEspeciales) {
    textoProcesado = textoProcesado.replace(patron, reemplazo);
  }
  
  // Correcciones ortográficas (se aplicarán durante el procesamiento de palabras)
  const correccionesOrtograficas = {
    'tolu': 'Tolú',
    'turistico': 'Turístico',
    'futbol': 'Fútbol',
    'microfutbol': 'Microfútbol',
    'softbol': 'Sóftbol',
    'pedagogico': 'Pedagógico',
    'oxidacion': 'Oxidación',
    'publica': 'Pública',
    'septimo': 'Séptimo',
    'dia': 'Día',
    'nazarth': 'Nazareth',
    'alegria': 'Alegría',
    'lucia': 'Lucía',
    'canca': 'Cancha',
    'patinaje': 'Patinaje',
    'patnaje': 'Patinaje'
  };
  
  // Si todo está en mayúsculas, normalizar primero
  if (textoProcesado === textoProcesado.toUpperCase() && textoProcesado.length > 1) {
    textoProcesado = textoProcesado.toLowerCase();
  }
  
  // Palabras que deben ir en minúsculas (excepto si son la primera palabra)
  // Nota: "y" va en minúsculas, "la" va en minúsculas excepto cuando es primera palabra o después de sigla
  const palabrasMinusculas = [
    'de', 'del', 'la', 'las', 'los', 'el', 'en', 'por', 'para', 
    'con', 'sin', 'sobre', 'bajo', 'entre', 'hasta', 'desde', 
    'durante', 'mediante', 'según', 'contra', 'hacia', 'tras',
    'y', 'o', 'a', 'un', 'una', 'unos', 'unas'
  ];
  
  // Lista de siglas conocidas (deben mantenerse en mayúsculas)
  const siglasConocidas = {
    'cdi': 'CDI',
    'idtolu': 'IDTOLÚ',
    'ie': 'I.E.',
    'i.e.': 'I.E.',
  };
  
  // Detectar siglas (palabras cortas que están completamente en mayúsculas o tienen puntos)
  const esSigla = (palabra) => {
    const palabraLower = palabra.toLowerCase();
    
    // Verificar si es una sigla conocida
    if (palabraLower in siglasConocidas) {
      return true;
    }
    
    // Si tiene puntos, probablemente es una sigla (I.E., C.D.I., etc.)
    if (palabra.includes('.')) return true;
    
    // Si es muy corta (2-6 caracteres) y está en mayúsculas, probablemente es sigla
    if (palabra.length >= 2 && palabra.length <= 6 && palabra === palabra.toUpperCase() && !palabrasMinusculas.includes(palabraLower)) {
      return true;
    }
    
    // Si tiene números mezclados con letras mayúsculas, probablemente es sigla
    if (/^[A-Z0-9]+$/.test(palabra) && palabra.length <= 6) return true;
    
    // Si es muy corta (2-3 caracteres) y está en mayúsculas o title case
    if (palabra.length >= 2 && palabra.length <= 3) {
      const esMayusculas = palabra === palabra.toUpperCase();
      const esTitleCase = palabra[0] === palabra[0].toUpperCase() && palabra.slice(1) === palabra.slice(1).toLowerCase();
      if (esMayusculas || esTitleCase) {
        // Verificar que no sea una palabra común
        if (!palabrasMinusculas.includes(palabraLower) && palabraLower !== 'y') {
          return true;
        }
      }
    }
    
    return false;
  };
  
  return textoProcesado
    .split(' ')
    .filter(palabra => palabra.trim().length > 0) // Filtrar espacios vacíos
    .map((palabra, index) => {
      let palabraOriginal = palabra.trim();
      const palabraLower = palabraOriginal.toLowerCase();
      
      // Verificar si es una sigla conocida
      if (palabraLower in siglasConocidas) {
        return siglasConocidas[palabraLower];
      }
      
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
      
      // "La" después de una sigla (como "CDI La Esperanza") debe ir con mayúscula
      if (palabraLower === 'la' && index > 0 && resultado.length > 0) {
        // Verificar si la palabra anterior es una sigla
        const palabraAnterior = resultado[resultado.length - 1] || '';
        // Si la anterior es una sigla (mayúsculas) o es "CDI", capitalizar "La"
        if (palabraAnterior === palabraAnterior.toUpperCase() || palabraAnterior === 'CDI') {
          return 'La';
        } else {
          return 'la';
        }
      }
      
      // Si es un artículo/preposición/conjunción, poner en minúsculas (sin importar cómo venga)
      if (palabrasMinusculas.includes(palabraLower)) {
        return palabraLower;
      }
      
      // Para el resto, capitalizar primera letra y resto en minúsculas
      const primeraLetra = palabraOriginal.charAt(0).toUpperCase();
      const resto = palabraOriginal.slice(1).toLowerCase();
      return primeraLetra + resto;
    })
    .join(' ');
  
  // Detectar y encerrar "Sede" entre paréntesis
  // Patrón 1: " - Sede X" → " (Sede X)" (cuando hay guion antes)
  textoProcesado = textoProcesado.replace(/\s+-\s+(Sede\s+[^-]+?)(?:\s*-\s*|$)/g, ' ($1)');
  // Patrón 2: "Sede X" al final del texto (sin guion antes, pero puede haber espacio)
  textoProcesado = textoProcesado.replace(/\s+(Sede\s+[A-Za-z0-9\s]+?)(?:\s*-\s*|$)/g, ' ($1)');
  // Limpiar espacios dobles que puedan quedar
  textoProcesado = textoProcesado.replace(/\s+/g, ' ').trim();
  
  return textoProcesado;
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
  console.log('🔄 transformarDatos() llamado con:', Array.isArray(datos) ? datos.length : typeof datos, 'items');
  
  if (!datos || !Array.isArray(datos)) {
    console.warn('⚠️ transformarDatos: datos inválidos o no es array');
    return [];
  }

  console.log('📊 transformarDatos: Procesando', datos.length, 'registros...');
  
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
  
  console.log('✅ transformarDatos: Completado -', validos, 'válidos,', invalidos, 'inválidos');
  console.log('📦 transformarDatos: Retornando', lugaresTransformados.length, 'lugares transformados');
  
  return lugaresTransformados;
};

/**
 * Obtiene los lugares desde el backend de DIME (prioridad) o API directa (fallback)
 * @returns {Promise<Array>} - Array de lugares transformados
 */
export const obtenerLugares = async () => {
  console.log('📡 obtenerLugares() llamado');
  
  // Detectar si estamos en producción
  const isProduction = typeof window !== 'undefined' && 
    (window.location.hostname !== 'localhost' && 
     window.location.hostname !== '127.0.0.1' &&
     !window.location.hostname.includes('192.168.'));
  
  console.log('🌍 Entorno detectado:', {
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
    isProduction,
    BACKEND_URL
  });
  
  // En producción, si BACKEND_URL es localhost, saltar directamente a API directa
  const shouldSkipBackend = isProduction && BACKEND_URL.includes('localhost');
  
  console.log('🔀 Estrategia:', shouldSkipBackend ? 'Saltar backend, usar API directa' : 'Intentar backend primero');
  
  // Intentar primero con el backend (solo si no estamos en producción con localhost)
  if (!shouldSkipBackend) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout de 3 segundos
      
      console.log('🔗 Intentando conectar con backend:', BACKEND_URL);
      
      const response = await fetch(BACKEND_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        // El backend ya devuelve los datos formateados, solo validar que sea un array
        if (Array.isArray(data)) {
          console.log('✅ Datos obtenidos del backend:', data.length, 'lugares');
          return data;
        } else if (data.error) {
          throw new Error(data.error);
        }
      }
    } catch (backendError) {
      // Si el backend falla (no disponible, timeout, CORS, etc.), usar API directa
      console.log('⚠️ Backend no disponible, usando API directa:', backendError.message);
    }
  } else {
    console.log('⚠️ En producción sin backend configurado, usando API directa');
  }
  
  // Fallback: Obtener desde la API directa de datos.gov.co
  try {
    console.log('🌐 Obteniendo datos desde API directa de datos.gov.co...');
    
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
    console.log('📦 Datos recibidos de API directa:', Array.isArray(data) ? data.length : 'no es array', 'registros');
    
    // La API devuelve directamente un array de objetos
    let lugares = [];
    
    if (Array.isArray(data)) {
      lugares = data;
    } else if (data.data && Array.isArray(data.data)) {
      lugares = data.data;
    } else {
      return [];
    }

    console.log('🔄 Llamando transformarDatos con', lugares.length, 'lugares...');
    const lugaresTransformados = transformarDatos(lugares);
    console.log('✅ Lugares transformados:', lugaresTransformados.length, 'lugares válidos');
    
    if (lugaresTransformados.length === 0) {
      console.warn('⚠️ transformarDatos retornó array vacío. Primeros 3 items originales:', lugares.slice(0, 3));
    }
    
    return lugaresTransformados;
  } catch (error) {
    // En caso de error, lanzar para que el componente pueda manejarlo
    console.error('❌ Error en obtenerLugares (fallback):', error);
    throw error;
  }
};

/**
 * Obtiene los lugares con caché (para evitar múltiples llamadas)
 * @param {number} cacheTime - Tiempo de caché en milisegundos (default: 5 minutos)
 * @returns {Promise<Array>} - Array de lugares transformados
 */
export const obtenerLugaresConCache = async (cacheTime = 5 * 60 * 1000) => {
  // Versión del caché - cambiar esto invalida el caché anterior
  const CACHE_VERSION = 'v11-sede-entre-parentesis';
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
      const datosCache = JSON.parse(cachedData);
      return datosCache;
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

