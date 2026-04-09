/**
 * Telemetría: eventos locales + envío por lotes al backend (Firestore en GCP).
 */

import { getOrCreateUserId } from './userService';
import { apiClient } from './apiClient';

const EVENTS_KEY = 'dime_analytics_events';
const PENDING_KEY = 'dime_analytics_pending';
const SESSION_START_KEY = 'dime_session_start';
const MAX_EVENTS_STORED = 100;
const MAX_PENDING = 200;
const FLUSH_INTERVAL_MS = 30000;
const FLUSH_DEBOUNCE_MS = 5000;
const BATCH_SIZE = 50;

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/** Desactivar ingesta: VITE_ANALYTICS_INGEST=false */
const INGEST_ENABLED = import.meta.env.VITE_ANALYTICS_INGEST !== 'false';

/**
 * Entorno analítico: qa (build --mode qa), prod (build production), dev (vite dev).
 * Opcional: VITE_APP_ENV=qa|prod|dev para forzar.
 */
export function getAnalyticsEnvironment() {
  const forced = import.meta.env.VITE_APP_ENV?.trim().toLowerCase();
  if (forced === 'qa' || forced === 'prod' || forced === 'dev') return forced;
  const mode = import.meta.env.MODE;
  if (mode === 'qa') return 'qa';
  if (mode === 'production') return 'prod';
  return 'dev';
}

let debounceTimer = null;
let transportStarted = false;

function getUserId() {
  return getOrCreateUserId();
}

function getPending() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  } catch {
    return [];
  }
}

function savePending(list) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-MAX_PENDING)));
  } catch {}
}

function enqueuePending(event) {
  const p = getPending();
  p.push(event);
  savePending(p);
}

function eventToApi(raw) {
  const { name, user_id, timestamp, environment, ...rest } = raw;
  return {
    name,
    user_id,
    timestamp_ms: typeof timestamp === 'number' ? timestamp : Date.now(),
    environment: environment || getAnalyticsEnvironment(),
    properties: rest,
  };
}

function scheduleFlush() {
  if (!INGEST_ENABLED) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    flushPending();
  }, FLUSH_DEBOUNCE_MS);
}

export async function flushPending() {
  if (!INGEST_ENABLED) return;

  let pending = getPending();
  while (pending.length > 0) {
    const chunk = pending.slice(0, BATCH_SIZE);
    const body = { events: chunk.map(eventToApi) };
    try {
      await apiClient.post('/api/analytics/events', body);
      pending = pending.slice(BATCH_SIZE);
      savePending(pending);
    } catch {
      break;
    }
  }
}

function flushWithBeacon() {
  if (!INGEST_ENABLED) return;
  const pending = getPending();
  if (!pending.length || typeof navigator.sendBeacon !== 'function') return;

  const chunk = pending.slice(0, BATCH_SIZE);
  const url = `${BASE_URL.replace(/\/$/, '')}/api/analytics/events`;
  const body = JSON.stringify({ events: chunk.map(eventToApi) });
  const blob = new Blob([body], { type: 'application/json' });
  const ok = navigator.sendBeacon(url, blob);
  if (ok) savePending(pending.slice(BATCH_SIZE));
}

function startTransport() {
  if (transportStarted || typeof window === 'undefined') return;
  transportStarted = true;
  window.setInterval(() => flushPending(), FLUSH_INTERVAL_MS);
  window.addEventListener('pagehide', () => flushWithBeacon());
}

export function trackEvent(eventName, payload = {}) {
  const event = {
    name: eventName,
    user_id: getUserId(),
    timestamp: Date.now(),
    ...payload,
    environment: getAnalyticsEnvironment(),
  };

  if (import.meta.env.DEV) {
    console.debug('[Analytics]', eventName, payload);
  }

  try {
    const stored = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    stored.push(event);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(stored.slice(-MAX_EVENTS_STORED)));
  } catch {}

  enqueuePending(event);
  startTransport();

  if (INGEST_ENABLED && getPending().length >= BATCH_SIZE) {
    flushPending();
  } else {
    scheduleFlush();
  }
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
