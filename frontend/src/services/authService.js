/**
 * Servicio de autenticacion.
 * Gestiona tokens de API para futura proteccion de rutas.
 */

const TOKEN_KEY = 'dime_api_token';

/**
 * Obtiene el token almacenado.
 */
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Guarda el token.
 */
export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.warn('[authService] No se pudo guardar el token:', e);
  }
}

/**
 * Elimina el token.
 */
export function clearToken() {
  setToken(null);
}

/**
 * Indica si hay un token configurado.
 */
export function isAuthenticated() {
  return Boolean(getToken());
}
