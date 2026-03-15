/**
 * Servicios de la aplicacion.
 * Exporta todos los servicios para consumo centralizado.
 */

export { apiClient } from './apiClient';
export { obtenerLugares, obtenerLugaresConCache } from './lugaresService';
export { enviarMensajeChat } from './chatService';
export { getToken, setToken, clearToken, isAuthenticated } from './authService';
export { getOrCreateUserId, hasUserSession, setUserName, getUserName } from './userService';
export { trackEvent, startSession, endSession, trackMarkerClick, trackChatMessageSent, trackChatMessageReceived, trackVoiceInput, trackReportSubmitted } from './analyticsService';
