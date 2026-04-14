/**
 * Utilidades de formateo de texto.
 * Usado en lugaresService para nombres y zonas.
 */

export const toTitleCase = (texto) => {
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
    'LABORATORIO DE INVESTIGACION Y DESARROLLO DE TOLU - IDTOLU': 'Laboratorio de Investigación y Desarrollo de Tolú - IDTOLÚ',
    'Laboratorio de Investigacion Y Desarrollo de Tolú - Idtolu': 'Laboratorio de Investigación y Desarrollo de Tolú - IDTOLÚ',
    'LABORATORIO DE INVESTIGACION Y DESARROLLO DE TOLU - IDTOLÚ': 'Laboratorio de Investigación y Desarrollo de Tolú - IDTOLÚ',
    'laboratorio de investigacion y desarrollo de tolu - idtolu': 'Laboratorio de Investigación y Desarrollo de Tolú - IDTOLÚ',
    'INSTITUTO FREINET PRE ESCOLAR Y PRIMARIA': 'Instituto Freinet Pre-Escolar y Primaria',
    'Instituto Freinet Pre Escolar Y Primaria': 'Instituto Freinet Pre-Escolar y Primaria',
    'Instituto Freinet Pre-Escolar y Primaria': 'Instituto Freinet Pre-Escolar y Primaria',
    'OFICINA AMBIENTAL Y AGROPECUARIA': 'Oficina Ambiental y Agropecuaria',
    'Oficina Ambiental Y Agropecuaria': 'Oficina Ambiental y Agropecuaria',
    'CDI LA ESPERANZA DE LOS NIÑOS': 'CDI La Esperanza de los Niños',
    'CDI la Esperanza de los Niños': 'CDI La Esperanza de los Niños',
  };

  if (textoNormalizado in correcciones) return correcciones[textoNormalizado];
  if (textoNormalizado.toUpperCase() in correcciones) return correcciones[textoNormalizado.toUpperCase()];
  if (textoNormalizado.toLowerCase() in correcciones) return correcciones[textoNormalizado.toLowerCase()];
  const textoTitleCase = textoNormalizado
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
  if (textoTitleCase in correcciones) return correcciones[textoTitleCase];

  const reemplazosEspeciales = [
    { patron: /\b(INSTITUCION|INSTITUCIÓN)\s+EDUCATIVA\b/gi, reemplazo: 'I.E.' },
  ];
  let textoProcesado = textoNormalizado;
  for (const { patron, reemplazo } of reemplazosEspeciales) {
    textoProcesado = textoProcesado.replace(patron, reemplazo);
  }

  const correccionesOrtograficas = {
    tolu: 'Tolú', turistico: 'Turístico', futbol: 'Fútbol', microfutbol: 'Microfútbol',
    softbol: 'Sóftbol', pedagogico: 'Pedagógico', oxidacion: 'Oxidación', publica: 'Pública',
    septimo: 'Séptimo', dia: 'Día', nazarth: 'Nazareth', alegria: 'Alegría', lucia: 'Lucía',
    canca: 'Cancha', patinaje: 'Patinaje', patnaje: 'Patinaje',
  };

  if (textoProcesado === textoProcesado.toUpperCase() && textoProcesado.length > 1) {
    textoProcesado = textoProcesado.toLowerCase();
  }

  const palabrasMinusculas = ['de', 'del', 'la', 'las', 'los', 'el', 'en', 'por', 'para', 'con', 'sin', 'sobre', 'bajo', 'entre', 'hasta', 'desde', 'durante', 'mediante', 'según', 'contra', 'hacia', 'tras', 'y', 'o', 'a', 'un', 'una', 'unos', 'unas'];
  const siglasConocidas = { cdi: 'CDI', idtolu: 'IDTOLÚ', ie: 'I.E.', 'i.e.': 'I.E.' };

  const esSigla = (palabra) => {
    const pl = palabra.toLowerCase();
    if (pl in siglasConocidas) return true;
    if (palabra.includes('.')) return true;
    if (palabra.length >= 2 && palabra.length <= 6 && palabra === palabra.toUpperCase() && !palabrasMinusculas.includes(pl)) return true;
    if (/^[A-Z0-9]+$/.test(palabra) && palabra.length <= 6) return true;
    if (palabra.length >= 2 && palabra.length <= 3 && (palabra === palabra.toUpperCase() || (palabra[0] === palabra[0].toUpperCase() && palabra.slice(1) === palabra.slice(1).toLowerCase())) && !palabrasMinusculas.includes(pl) && pl !== 'y') return true;
    return false;
  };

  const palabras = textoProcesado.split(' ').filter((p) => p.trim().length > 0);
  const resultado = palabras.map((palabra, index) => {
    const pl = palabra.trim().toLowerCase();
    if (pl in siglasConocidas) return siglasConocidas[pl];
    if (correccionesOrtograficas[pl]) {
      const corr = correccionesOrtograficas[pl];
      return index > 0 && palabrasMinusculas.includes(corr.toLowerCase()) ? corr.toLowerCase() : corr;
    }
    if (esSigla(palabra.trim())) return palabra.trim().toUpperCase();
    if (index === 0) return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
    if (palabrasMinusculas.includes(pl)) return pl;
    return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
  });

  const resultadoFinal = resultado.map((palabra, index) => {
    if (palabra.toLowerCase() === 'la' && index > 0) {
      const ant = resultado[index - 1] || '';
      return ant === ant.toUpperCase() || ant === 'CDI' ? 'La' : 'la';
    }
    return palabra;
  });

  let textoFinal = resultadoFinal.join(' ');
  textoFinal = textoFinal.replace(/\s+-\s+(Sede\s+[^-]+?)(?:\s*-\s*|$)/g, ' ($1)');
  textoFinal = textoFinal.replace(/\s+(Sede\s+[A-Za-z0-9\s]+?)(?:\s*-\s*|$)/g, ' ($1)');
  return textoFinal.replace(/\s+/g, ' ').trim();
};

export const formatearZona = (zona) => {
  if (!zona || typeof zona !== 'string') return 'Dirección no disponible';
  return `Zona: ${toTitleCase(zona.trim())}`;
};
