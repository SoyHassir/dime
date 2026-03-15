/**
 * Cliente Axios global para el backend DIME.
 * - Base URL centralizada
 * - Interceptores para token/headers y manejo de errores
 */

import axios from 'axios';
import { getToken } from './authService';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor de request: inyecta token y headers
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response: manejo centralizado de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const mensaje = data?.error || data?.detail || error.message;

      switch (status) {
        case 401:
          console.warn('[API] No autorizado:', mensaje);
          break;
        case 403:
          console.warn('[API] Acceso denegado:', mensaje);
          break;
        case 404:
          console.warn('[API] Recurso no encontrado:', mensaje);
          break;
        case 422:
          console.warn('[API] Datos invalidos:', mensaje);
          break;
        case 500:
          console.error('[API] Error del servidor:', mensaje);
          break;
        default:
          console.error('[API] Error:', status, mensaje);
      }

      error.apiMessage = mensaje;
    } else if (error.code === 'ECONNABORTED') {
      error.apiMessage = 'La peticion tardo demasiado. Intenta de nuevo.';
    } else if (error.message === 'Network Error') {
      error.apiMessage = 'Error de conexion. Verifica tu internet.';
    } else {
      error.apiMessage = error.message || 'Error desconocido';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
