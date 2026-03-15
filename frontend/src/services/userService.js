/**
 * Servicio de usuario (captura con friccion cero).
 * Genera ID anonimo o guarda nombre opcional.
 */

const USER_ID_KEY = 'dime_user_id';
const USER_NAME_KEY = 'dime_user_name';
const USER_FIRST_SEEN_KEY = 'dime_user_first_seen';

function generateAnonymousId() {
  try {
    return crypto.randomUUID?.() || `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  } catch {
    return `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

/**
 * Obtiene o crea el ID del usuario.
 */
export function getOrCreateUserId() {
  try {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = generateAnonymousId();
      localStorage.setItem(USER_ID_KEY, id);
      localStorage.setItem(USER_FIRST_SEEN_KEY, Date.now().toString());
    }
    return id;
  } catch {
    return generateAnonymousId();
  }
}

/**
 * Indica si el usuario ya fue capturado (tiene ID).
 */
export function hasUserSession() {
  try {
    return !!localStorage.getItem(USER_ID_KEY);
  } catch {
    return false;
  }
}

/**
 * Guarda el nombre del usuario (opcional).
 */
export function setUserName(name) {
  try {
    if (name && typeof name === 'string') {
      localStorage.setItem(USER_NAME_KEY, name.trim().slice(0, 100));
    } else {
      localStorage.removeItem(USER_NAME_KEY);
    }
  } catch {}
}

/**
 * Obtiene el nombre guardado.
 */
export function getUserName() {
  try {
    return localStorage.getItem(USER_NAME_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Inicializa la sesion: crea ID si no existe, guarda nombre si se proporciona.
 */
export function initUserSession(name = null) {
  const id = getOrCreateUserId();
  if (name) setUserName(name);
  return { id, name: getUserName() || name };
}
