/**
 * Servicio de lugares.
 * Consume /api/lugares del backend o datos.gov.co como fallback.
 */

import axios from 'axios';
import apiClient from './apiClient';
import { toTitleCase, formatearZona } from '../utils/formatters';

const API_TOKEN = 'CVraNSsLcjWDoVyJlV6LEmEaU';
const API_URL = 'https://www.datos.gov.co/resource/gi7q-5bgv.json';

const CACHE_VERSION = 'v11-sede-entre-parentesis';
const CACHE_KEY = `dime-lugares-cache-${CACHE_VERSION}`;
const CACHE_TIMESTAMP_KEY = `dime-lugares-cache-timestamp-${CACHE_VERSION}`;

function transformarDatos(datos) {
  if (!datos || !Array.isArray(datos)) return [];

  return datos
    .map((item, index) => {
      let lat = null;
      let lng = null;

      if (item.latitud != null && item.longitud != null) {
        lat = typeof item.latitud === 'string' ? parseFloat(item.latitud) : Number(item.latitud);
        lng = typeof item.longitud === 'string' ? parseFloat(item.longitud) : Number(item.longitud);
      } else if (item.coordenadas) {
        const coords = item.coordenadas.split(',');
        lat = parseFloat(coords[0]);
        lng = parseFloat(coords[1]);
      } else if (item.geo_loc?.coordinates?.length >= 2) {
        lng = typeof item.geo_loc.coordinates[0] === 'string' ? parseFloat(item.geo_loc.coordinates[0]) : Number(item.geo_loc.coordinates[0]);
        lat = typeof item.geo_loc.coordinates[1] === 'string' ? parseFloat(item.geo_loc.coordinates[1]) : Number(item.geo_loc.coordinates[1]);
      }

      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0 || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return null;
      }

      return {
        id: index + 1,
        nombre: item.infraestructura ? toTitleCase(item.infraestructura) : 'Sin nombre',
        categoria: item.categoria ? toTitleCase(item.categoria) : 'Otros',
        ubicacion: { lat, lng },
        direccion: formatearZona(item.zona),
      };
    })
    .filter(
      (item) =>
        item &&
        item.ubicacion &&
        typeof item.ubicacion.lat === 'number' &&
        typeof item.ubicacion.lng === 'number' &&
        !isNaN(item.ubicacion.lat) &&
        !isNaN(item.ubicacion.lng)
    );
}

/**
 * Obtiene lugares desde el backend o datos.gov.co (fallback).
 */
export async function obtenerLugares() {
  const isProduction =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.includes('192.168.');

  const baseUrl = apiClient.defaults.baseURL || '';
  const shouldSkipBackend = isProduction && baseUrl.includes('localhost');

  if (!shouldSkipBackend) {
    try {
      const { data } = await apiClient.get('/api/lugares', { timeout: 10000 });
      if (Array.isArray(data)) return data;
      if (data?.error) throw new Error(data.error);
    } catch {
      // Fallback a datos.gov.co
    }
  }

  const { data } = await axios.get(API_URL, {
    params: { $limit: 5000 },
    headers: { 'X-App-Token': API_TOKEN, Accept: 'application/json' },
    timeout: 15000,
  });

  const lugares = Array.isArray(data) ? data : data?.data ?? [];
  return transformarDatos(lugares);
}

/**
 * Obtiene lugares con cache en localStorage.
 */
export async function obtenerLugaresConCache(cacheTime = 5 * 60 * 1000) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('dime-lugares-cache') && !key.includes(CACHE_VERSION)) {
        localStorage.removeItem(key);
      }
    }
  } catch {}

  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

  if (cachedData && cachedTimestamp) {
    const age = Date.now() - parseInt(cachedTimestamp, 10);
    if (age < cacheTime) return JSON.parse(cachedData);
  }

  const lugares = await obtenerLugares();
  if (lugares.length > 0) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(lugares));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  }
  return lugares;
}
