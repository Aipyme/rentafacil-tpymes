/**
 * Notificaciones internas — versión independiente de Manus.
 * Registra en consola. Para notificaciones reales, usa n8n o Brevo directamente.
 */

export type NotificationPayload = {
  title: string;
  content: string;
};

/**
 * Registra una notificación interna en el log del servidor.
 * Retorna siempre true para compatibilidad con el código existente.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  console.log(`[NOTIFICACIÓN] ${payload.title}: ${payload.content}`);
  return true;
}
