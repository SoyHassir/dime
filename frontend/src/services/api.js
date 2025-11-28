const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api/lugares';
const API_TOKEN = 'CVraNSsLcjWDoVyJlV6LEmEaU';
const API_URL = 'https://www.datos.gov.co/resource/gi7q-5bgv.json';

const toTitleCase = (texto) => {
  if (!texto || typeof texto !== 'string') return texto;
  
  const textoNormalizado = texto.replace(/\s+/g, ' ').trim();
  
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
  
  if (textoNormalizado in correcciones) {
    return correcciones[textoNormalizado];
  }
  if (textoNormalizado.toUpperCase() in correcciones) {
    return correcciones[textoNormalizado.toUpperCase()];
  }
  if (textoNormalizado.toLowerCase() in correcciones) {
    return correcciones[textoNormalizado.toLowerCase()];
  }
  const textoTitleCase = textoNormalizado
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
    .join(' ');
  if (textoTitleCase in correcciones) {
    return correcciones[textoTitleCase];
  }
  
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
  
  let textoProcesado = textoNormalizado;
  for (const { patron, reemplazo } of reemplazosEspeciales) {
    textoProcesado = textoProcesado.replace(patron, reemplazo);
  }
  
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
  
  if (textoProcesado === textoProcesado.toUpperCase() && textoProcesado.length > 1) {
    textoProcesado = textoProcesado.toLowerCase();
  }
  
  const palabrasMinusculas = [
    'de', 'del', 'la', 'las', 'los', 'el', 'en', 'por', 'para', 
    'con', 'sin', 'sobre', 'bajo', 'entre', 'hasta', 'desde', 
    'durante', 'mediante', 'según', 'contra', 'hacia', 'tras',
    'y', 'o', 'a', 'un', 'una', 'unos', 'unas'
  ];
  
  const siglasConocidas = {
    'cdi': 'CDI',
    'idtolu': 'IDTOLÚ',
    'ie': 'I.E.',
    'i.e.': 'I.E.',
  };
  
  const esSigla = (palabra) => {
    const palabraLower = palabra.toLowerCase();
    
    if (palabraLower in siglasConocidas) {
      return true;
    }
    
    if (palabra.includes('.')) return true;
    
    if (palabra.length >= 2 && palabra.length <= 6 && palabra === palabra.toUpperCase() && !palabrasMinusculas.includes(palabraLower)) {
      return true;
    }
    
    if (/^[A-Z0-9]+$/.test(palabra) && palabra.length <= 6) return true;
    
    if (palabra.length >= 2 && palabra.length <= 3) {
      const esMayusculas = palabra === palabra.toUpperCase();
      const esTitleCase = palabra[0] === palabra[0].toUpperCase() && palabra.slice(1) === palabra.slice(1).toLowerCase();
      if (esMayusculas || esTitleCase) {
        if (!palabrasMinusculas.includes(palabraLower) && palabraLower !== 'y') {
          return true;
        }
      }
    }
    
    return false;
  };
  
  const palabras = textoProcesado
    .split(' ')
    .filter(palabra => palabra.trim().length > 0);
  
  const resultado = palabras.map((palabra, index) => {
    let palabraOriginal = palabra.trim();
    const palabraLower = palabraOriginal.toLowerCase();
    
    if (palabraLower in siglasConocidas) {
      return siglasConocidas[palabraLower];
    }
    
    let palabraCorregida = correccionesOrtograficas[palabraLower];
    if (palabraCorregida) {
      if (index === 0) {
        return palabraCorregida;
      } else {
        const palabraCorregidaLower = palabraCorregida.toLowerCase();
        if (palabrasMinusculas.includes(palabraCorregidaLower)) {
          return palabraCorregidaLower;
        }
        return palabraCorregida;
      }
    }
    
    if (esSigla(palabraOriginal)) {
      return palabraOriginal.toUpperCase();
    }
    
    if (index === 0) {
      const primeraLetra = palabraOriginal.charAt(0).toUpperCase();
      const resto = palabraOriginal.slice(1).toLowerCase();
      return primeraLetra + resto;
    }
    
    if (palabrasMinusculas.includes(palabraLower)) {
      return palabraLower;
    }
    
    const primeraLetra = palabraOriginal.charAt(0).toUpperCase();
    const resto = palabraOriginal.slice(1).toLowerCase();
    return primeraLetra + resto;
  });
  
  const resultadoFinal = resultado.map((palabra, index) => {
    if (palabra.toLowerCase() === 'la' && index > 0) {
      const palabraAnterior = resultado[index - 1] || '';
      if (palabraAnterior === palabraAnterior.toUpperCase() || palabraAnterior === 'CDI') {
        return 'La';
      } else {
        return 'la';
      }
    }
    return palabra;
  });
  
  let textoFinal = resultadoFinal.join(' ');
  textoFinal = textoFinal.replace(/\s+-\s+(Sede\s+[^-]+?)(?:\s*-\s*|$)/g, ' ($1)');
  textoFinal = textoFinal.replace(/\s+(Sede\s+[A-Za-z0-9\s]+?)(?:\s*-\s*|$)/g, ' ($1)');
  textoFinal = textoFinal.replace(/\s+/g, ' ').trim();
  
  return textoFinal;
};

const formatearZona = (zona) => {
  if (!zona || typeof zona !== 'string') return 'Dirección no disponible';
  
  const zonaFormateada = toTitleCase(zona.trim());
  return `Zona: ${zonaFormateada}`;
};

const transformarDatos = (datos) => {
  if (!datos || !Array.isArray(datos)) {
    return [];
  }
  
  const lugaresTransformados = datos.map((item, index) => {
    let lat = null;
    let lng = null;
    
    if (item.latitud !== undefined && item.latitud !== null && 
        item.longitud !== undefined && item.longitud !== null) {
      lat = typeof item.latitud === 'string' ? parseFloat(item.latitud) : Number(item.latitud);
      lng = typeof item.longitud === 'string' ? parseFloat(item.longitud) : Number(item.longitud);
    } else if (item.coordenadas) {
      const coords = item.coordenadas.split(',');
      lat = parseFloat(coords[0]);
      lng = parseFloat(coords[1]);
    } else if (item.geo_loc && item.geo_loc.coordinates && Array.isArray(item.geo_loc.coordinates)) {
      lng = typeof item.geo_loc.coordinates[0] === 'string' 
        ? parseFloat(item.geo_loc.coordinates[0]) 
        : Number(item.geo_loc.coordinates[0]);
      lat = typeof item.geo_loc.coordinates[1] === 'string' 
        ? parseFloat(item.geo_loc.coordinates[1]) 
        : Number(item.geo_loc.coordinates[1]);
    }

    if (isNaN(lat) || isNaN(lng) || 
        lat === 0 || lng === 0 ||
        lat === null || lng === null ||
        lat < -90 || lat > 90 ||
        lng < -180 || lng > 180) {
      return null;
    }

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
    const esValido = item !== null && 
           item.ubicacion && 
           typeof item.ubicacion.lat === 'number' && 
           typeof item.ubicacion.lng === 'number' &&
           !isNaN(item.ubicacion.lat) && 
           !isNaN(item.ubicacion.lng);
    
    return esValido;
  });
  
  return lugaresTransformados;
};

export const obtenerLugares = async () => {
  const isProduction = typeof window !== 'undefined' && 
    (window.location.hostname !== 'localhost' && 
     window.location.hostname !== '127.0.0.1' &&
     !window.location.hostname.includes('192.168.'));
  
  const shouldSkipBackend = isProduction && BACKEND_URL.includes('localhost');
  
  if (!shouldSkipBackend) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
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
        if (Array.isArray(data)) {
          return data;
        } else if (data.error) {
          throw new Error(data.error);
        }
      }
    } catch (backendError) {
    }
  }
  
  try {
    const headers = {
      'X-App-Token': API_TOKEN,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    const urlConLimite = `${API_URL}?$limit=5000`;
    
    const response = await fetch(urlConLimite, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener datos: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
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
    console.error('Error al obtener lugares:', error);
    throw error;
  }
};

export const obtenerLugaresConCache = async (cacheTime = 5 * 60 * 1000) => {
  const CACHE_VERSION = 'v11-sede-entre-parentesis';
  const cacheKey = `dime-lugares-cache-${CACHE_VERSION}`;
  const cacheTimestampKey = `dime-lugares-cache-timestamp-${CACHE_VERSION}`;
  
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
  }
  
  const cachedData = localStorage.getItem(cacheKey);
  const cachedTimestamp = localStorage.getItem(cacheTimestampKey);
  
  if (cachedData && cachedTimestamp) {
    const now = Date.now();
    const cacheAge = now - parseInt(cachedTimestamp);
    
    if (cacheAge < cacheTime) {
      const datosCache = JSON.parse(cachedData);
      return datosCache;
    }
  }
  
  try {
    const lugares = await obtenerLugares();
    
    if (lugares.length > 0) {
      localStorage.setItem(cacheKey, JSON.stringify(lugares));
      localStorage.setItem(cacheTimestampKey, Date.now().toString());
    }
    
    return lugares;
  } catch (error) {
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    throw error;
  }
};

