/**
 * Servicio de telemetria y eventos.
 * Registra analiticas esenciales asociadas al identificador del usuario.
 */

import { getOrCreateUserId } from './userService';

const EVENTS_KEY = 'dime_analytics_events';
const SESSION_START_KEY = 'dime_session_start';
const MAX_EVENTS_STORED = 100;

/**
 * Obtiene el ID del usuario para asociar eventos.
 */
function getUserId() {
  return getOrCreateUserId();
}

/**
 * Registra un evento con telemetria.
 * @param {string} eventName - Nombre del evento
 * @param {object} payload - Datos adicionales del evento
 */
export function trackEvent(eventName, payload = {}) {
  const event = {
    name: eventName,
    user_id: getUserId(),
    timestamp: Date.now(),
    ...payload,
  };

  // Log en desarrollo
  if (import.meta.env.DEV) {
    console.debug('[Analytics]', eventName, payload);
  }

  // Guardar en localStorage para posible envio posterior
  try {
    const stored = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    stored.push(event);
    const trimmed = stored.slice(-MAX_EVENTS_STORED);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
  } catch {}

  // Punto de extension: enviar a backend/GA4/Mixpanel
  // sendToBackend(event);
}

/**
 * Inicia el seguimiento de sesion (tiempo de uso).
 */
export function startSession() {
  try {
    localStorage.setItem(SESSION_START_KEY, Date.now().toString());
    trackEvent('session_start', {});
  } catch {}
}

/**
 * Finaliza la sesion y registra tiempo de uso.
 */
export function endSession() {
  try {
    const start = localStorage.getItem(SESSION_START_KEY);
    if (start) {
      const durationMs = Date.now() - parseInt(start, 10);
      trackEvent('session_end', { duration_seconds: Math.round(durationMs / 1000) });
      localStorage.removeItem(SESSION_START_KEY);
    }
  } catch {}
}

/**
 * Registra el listener para enviar session_end al cerrar/abandonar la pagina.
 */
export function initSessionTracking() {
  if (typeof window === 'undefined') return;
  const handleUnload = () => endSession();
  window.addEventListener('beforeunload', handleUnload);
  window.addEventListener('pagehide', handleUnload);
}

/**
 * Registra clic en marcador del mapa.
 */
export function trackMarkerClick(lugarId, lugarNombre) {
  trackEvent('marker_click', { lugar_id: lugarId, lugar_nombre: lugarNombre });
}

/**
 * Registra mensaje enviado al chat.
 */
export function trackChatMessageSent() {
  trackEvent('chat_message_sent', {});
}

/**
 * Registra respuesta recibida del chat (profundidad del flujo).
 */
export function trackChatMessageReceived(conversationDepth) {
  trackEvent('chat_message_received', { conversation_depth: conversationDepth });
}

/**
 * Registra uso de voz (entrada).
 */
export function trackVoiceInput() {
  trackEvent('voice_input_used', {});
}

/**
 * Registra reporte enviado.
 */
export function trackReportSubmitted(tipoError) {
  trackEvent('report_submitted', { tipo_error: tipoError });
}

/**
 * Obtiene eventos almacenados (para debug o envio batch).
 */
export function getStoredEvents() {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
  } catch {
    return [];
  }
}
