"""
Formateo de texto para nombres de entidades y zonas.
Usado en contexto IA, lugares y respuestas.
"""

import re


def to_title_case(texto: str | None) -> str | None:
    """
    Formatea texto con mayúsculas/minúsculas correctas para nombres propios.
    Incluye correcciones ortográficas y manejo de siglas.
    """
    if not texto or not isinstance(texto, str):
        return texto

    texto_original = re.sub(r"\s+", " ", texto.strip())

    correcciones = {
        "I.E. PAULO Freire": "Institución Educativa Paulo Freire",
        "Intitucion Educativa JOSE Yemail TOUS - SEDE SAN Isidro": "Institución Educativa José Yemail Tous (Sede San Isidro)",
        "CDI LA Esperanza DE LOS Niños": "CDI La Esperanza de los Niños",
        "Instituto Pedagogico DEL GOLFO": "Instituto Pedagógico del Golfo",
        "CASA DE LA Cultura Municipal": "Casa de la Cultura Municipal",
        "VILLA Olimpica": "Villa Olímpica",
        "Laguna DE Oxidacion": "Laguna de Oxidación",
        "Biblioteca Publica Municipal Hector ROJAS Herazo": "Biblioteca Pública Municipal Héctor Rojas Herazo",
        "Iglesia Adventista DEL Septimo DIA EL Santuario": "Iglesia Adventista del Séptimo Día El Santuario",
        "Estadio DE Futbol": "Estadio de Fútbol",
        "CANCA DE Microfutbol VILLA Nazarth": "Cancha de Microfútbol Villa Nazareth",
        "Cancha DE Futbol VILLA Nazareth": "Cancha de Fútbol Villa Nazareth",
        "Glorieta Entrada DE Tolú": "Glorieta entrada de Tolú",
        "Intitucion Educativa JOSE Yemail TOUS - SEDE Alegria": "Institución Educativa José Yemail Tous (Sede Alegría)",
        "Parque Regional Natural Manglares DE Guacamaya": "Parque Regional Natural Manglares de Guacamaya",
        "Intitucion Educativa PITA EN MEDIO - SEDE LAS Cruces": "Institución Educativa Pita en Medio (Sede Las Cruces)",
        "Intitucion Educativa PITA EN MEDIO - SEDE Principal": "Institución Educativa Pita en Medio (Sede Principal)",
        "Intitucion Educativa PITA EN MEDIO - SEDE 2": "Institución Educativa Pita en Medio (Sede 2)",
        "Intitucion Educativa PITA ABAJO SEDE Principal": "Institución Educativa Pita Abajo (Sede Principal)",
        "Parque Corregimiento PITA ABAJO": "Parque Corregimiento Pita Abajo",
        "Cementerio Corregimiento PITA ABAJO": "Cementerio Corregimiento Pita Abajo",
        "Intitucion Educativa Educativo NUEVA ERA SEDE Principal": "Institución Educativa Nueva Era (Sede Principal)",
        "Intitucion Educativa NUEVA ERA SEDE SANTA LUCIA": "Institución Educativa Nueva Era (Sede Santa Lucía)",
        "Intitucion Educativa NUEVA ERA SEDE Puertas Negras": "Institución Educativa Nueva Era (Sede Puertas Negras)",
        "Cementerio Corregimiento Puerto VIEJO": "Cementerio Corregimiento Puerto Viejo",
        "Estadio DE Softbol Corregimiento Puerto VIEJO": "Estadio de Sóftbol Corregimiento Puerto Viejo",
        "Intitucion Educativa Puerto VIEJO SEDE Principal": "Institución Educativa Puerto Viejo (Sede Principal)",
        "Intitucion Educativa NUEVA ERA SEDE EL Palmar": "Institución Educativa Nueva Era (Sede El Palmar)",
        "Intitucion Educativa Puerto VIEJO SEDE PALO Blanco": "Institución Educativa Puerto Viejo (Sede Palo Blanco)",
        "PISTA DE PATINAJE": "Pista de Patinaje",
        "PISTA DE PATNAJE": "Pista de Patinaje",
        "pista de patinaje": "Pista de Patinaje",
        "Pista De Patinaje": "Pista de Patinaje",
        "PISTA DE PATINAGE": "Pista de Patinaje",
        "LABORATORIO DE INVESTIGACION Y DESARROLLO DE TOLU - IDTOLU": "Laboratorio de Investigación y Desarrollo de Tolú - IDTOLÚ",
        "Laboratorio de Investigacion Y Desarrollo de Tolú - Idtolu": "Laboratorio de Investigación y Desarrollo de Tolú - IDTOLÚ",
        "LABORATORIO DE INVESTIGACION Y DESARROLLO DE TOLU - IDTOLÚ": "Laboratorio de Investigación y Desarrollo de Tolú - IDTOLÚ",
        "laboratorio de investigacion y desarrollo de tolu - idtolu": "Laboratorio de Investigación y Desarrollo de Tolú - IDTOLÚ",
        "INSTITUTO FREINET PRE ESCOLAR Y PRIMARIA": "Instituto Freinet Pre-Escolar y Primaria",
        "Instituto Freinet Pre Escolar Y Primaria": "Instituto Freinet Pre-Escolar y Primaria",
        "Instituto Freinet Pre-Escolar y Primaria": "Instituto Freinet Pre-Escolar y Primaria",
        "OFICINA AMBIENTAL Y AGROPECUARIA": "Oficina Ambiental y Agropecuaria",
        "Oficina Ambiental Y Agropecuaria": "Oficina Ambiental y Agropecuaria",
        "CDI LA ESPERANZA DE LOS NIÑOS": "CDI La Esperanza de los Niños",
        "CDI la Esperanza de los Niños": "CDI La Esperanza de los Niños",
    }

    if texto_original in correcciones:
        return correcciones[texto_original]
    if texto_original.upper() in correcciones:
        return correcciones[texto_original.upper()]
    if texto_original.lower() in correcciones:
        return correcciones[texto_original.lower()]
    if texto_original.title() in correcciones:
        return correcciones[texto_original.title()]

    if texto_original.isupper() and len(texto_original) > 1:
        texto = texto_original.lower()
    else:
        texto = texto_original

    palabras_minusculas = [
        "de", "del", "la", "las", "los", "el", "en", "por", "para",
        "con", "sin", "sobre", "bajo", "entre", "hasta", "desde", "y", "o", "a",
    ]

    siglas_conocidas = {
        "cdi": "CDI",
        "idtolu": "IDTOLÚ",
        "ie": "I.E.",
        "i.e.": "I.E.",
    }

    texto = texto.replace("INSTITUCION EDUCATIVA", "Institución Educativa").replace(
        "INSTITUCIÓN EDUCATIVA", "Institución Educativa"
    )
    texto = texto.replace("Intitucion", "Institución").replace("INTITUCION", "Institución")
    texto = texto.replace("investigacion", "Investigación").replace("INVESTIGACION", "Investigación")

    palabras = texto.split()
    resultado = []
    for i, palabra in enumerate(palabras):
        palabra_lower = palabra.lower()

        if palabra_lower in siglas_conocidas:
            resultado.append(siglas_conocidas[palabra_lower])
            continue

        es_sigla = False
        if len(palabra) >= 2 and len(palabra) <= 6:
            if palabra.isupper() and palabra_lower not in palabras_minusculas:
                es_sigla = True
            elif any(c.isdigit() for c in palabra) and any(c.isalpha() for c in palabra):
                es_sigla = True
            elif len(palabra) <= 3 and (palabra.isupper() or (palabra[0].isupper() and palabra[1:].islower())):
                if palabra_lower not in palabras_minusculas and palabra_lower not in ["y", "o", "a"]:
                    es_sigla = True

        if es_sigla:
            resultado.append(palabra.upper())
            continue

        correcciones_ortograficas = {
            "tolu": "Tolú", "turistico": "Turístico", "futbol": "Fútbol",
            "intitucion": "Institución", "institucion": "Institución",
            "microfutbol": "Microfútbol", "softbol": "Sóftbol", "pedagogico": "Pedagógico",
            "oxidacion": "Oxidación", "publica": "Pública", "septimo": "Séptimo",
            "dia": "Día", "nazarth": "Nazareth", "alegria": "Alegría", "lucia": "Lucía",
            "viejo": "Viejo", "canca": "Cancha", "patinaje": "Patinaje", "patnaje": "Patinaje",
        }
        if palabra_lower in correcciones_ortograficas:
            resultado.append(correcciones_ortograficas[palabra_lower])
            continue

        if i == 0:
            resultado.append(palabra.capitalize())
        elif palabra_lower == "la" and i > 0 and len(resultado) > 0:
            palabra_anterior = resultado[-1] if resultado else ""
            if palabra_anterior.isupper() or palabra_anterior == "CDI":
                resultado.append("La")
            else:
                resultado.append("la")
        elif palabra_lower in palabras_minusculas:
            resultado.append(palabra_lower)
        else:
            resultado.append(palabra.capitalize())

    texto_formateado = " ".join(resultado)
    texto_formateado = re.sub(r"\s+-\s+(Sede\s+[^-]+?)(?:\s*-\s*|$)", r" (\1)", texto_formateado)
    texto_formateado = re.sub(r"\s+(Sede\s+[A-Za-z0-9\s]+?)(?:\s*-\s*|$)", r" (\1)", texto_formateado)
    texto_formateado = re.sub(r"\s+", " ", texto_formateado).strip()

    return texto_formateado


def formatear_zona(zona: str | None) -> str:
    """Formatea la zona (urbana/rural) para mostrar al usuario."""
    if not zona or not isinstance(zona, str):
        return "Dirección no disponible"
    zona_limpia = zona.strip()
    if zona_limpia:
        if zona_limpia.upper() == "URBANA":
            return "Zona: Urbana"
        elif zona_limpia.upper() == "RURAL":
            return "Zona: Rural"
        return f"Zona: {zona_limpia.capitalize()}"
    return "Dirección no disponible"
