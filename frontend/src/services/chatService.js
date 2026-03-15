/**
 * Servicio de chat con DIME-IA.
 * Consume POST /api/chat del backend.
 */

import apiClient from './apiClient';

/**
 * Envia una pregunta al chat y devuelve la respuesta.
 * @param {string} pregunta - Texto de la pregunta
 * @returns {Promise<{respuesta: string}>}
 */
export async function enviarMensajeChat(pregunta) {
  const { data } = await apiClient.post('/api/chat', { pregunta: pregunta.trim() });
  return data;
}
