/**
 * Mensajes centralizados de la aplicación
 * Facilita la internacionalización futura y el mantenimiento
 */

export const MESSAGES = {
  // Mensajes de éxito
  SUCCESS: {
    MURAL_ENVIADO: "¡Enviado! Tu mural está pendiente de aprobación.",
    REPORTE_ENVIADO: "¡Reporte enviado con éxito! Gracias por tu colaboración.",
    OPERACION_COMPLETADA: "Operación completada con éxito.",
  },

  // Mensajes de error
  ERROR: {
    ENVIAR_MURAL: "Error al enviar. Intenta de nuevo.",
    ENVIAR_REPORTE: "Error al enviar el reporte.",
    SUBIR_IMAGEN: "Error al subir la imagen",
    PROCESAR_SOLICITUD: "Error al procesar la solicitud.",
    ACTUALIZAR_ESTADO: "Error al actualizar el estado",
    PROCESAR_MODIFICACION: "Error al procesar la solicitud de modificación",
    CARGAR_MURALES: "Error al cargar los murales",
    ID_INVALIDO: "ID de mural no válido.",
    INICIAR_SESION: "Error al iniciar sesión",
    INESPERADO: "Error inesperado al iniciar sesión",
  },

  // Validaciones
  VALIDATION: {
    SELECCIONAR_MAPA: "Por favor selecciona un punto en el mapa.",
    SELECCIONAR_FOTO: "Debes seleccionar una foto del mural.",
    SELECCIONAR_FOTO_REPORTE: "Por favor selecciona una foto.",
    ARCHIVO_INVALIDO: "Por favor selecciona un archivo de imagen válido",
    ARCHIVO_MUY_GRANDE: "La imagen es demasiado grande. Máximo 5 MB",
  },

  // Estados de carga
  LOADING: {
    MAPA: "Cargando mapa...",
    PUNTOS: "Cargando puntos...",
    GENERAL: "Cargando...",
    SUBIENDO_IMAGEN: "Subiendo imagen...",
    ENVIANDO: "Enviando...",
    INICIANDO_SESION: "Iniciando sesión...",
  },

  // Labels y textos de UI
  UI: {
    ENVIAR: "Enviar",
    ENVIAR_REPORTE: "Enviar Reporte",
    INICIAR_SESION: "Iniciar Sesión",
    VER_MAPA: "🗺️ Ver Mapa",
    VER_EN_MAPA: "🗺️ Ver en mapa",
    AGREGAR_NUEVO: "Agregar Nuevo",
    NUEVO: "Nuevo",
  },
} as const;

/**
 * Helper para obtener mensajes con fallback
 */
export function getMessage(
  category: keyof typeof MESSAGES,
  key: string,
  fallback?: string,
): string {
  const categoryMessages = MESSAGES[category] as Record<string, string>;
  return categoryMessages[key] || fallback || "Mensaje no encontrado";
}
