/**
 * Constantes de UI y estilos centralizadas
 * Facilita el mantenimiento y consistencia visual
 */

// Tamaños de imágenes
export const IMAGE_SIZES = {
  THUMBNAIL: {
    WIDTH: 64, // w-16
    HEIGHT: 64, // h-16
  },
  PREVIEW: {
    MAX_WIDTH: 300,
    MAX_HEIGHT: 300,
  },
  ADMIN_THUMBNAIL: {
    WIDTH: 128, // w-32
    HEIGHT: 128, // h-32
  },
} as const;

// Tamaños de archivo
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE_MB: 10,
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
} as const;

// Dimensiones de mapa
export const MAP_CONFIG = {
  DEFAULT_HEIGHT: 450,
  MIN_HEIGHT: 450,
  DEFAULT_ZOOM: 20,
} as const;

// Dimensiones de tarjetas de estadísticas
export const STATS_CARD = {
  MIN_WIDTH: 120,
} as const;

// Colores de estados (para consistencia)
export const STATE_COLORS = {
  TOTAL: '#3B82F6', // Blue
  APROBADOS: '#DC2626', // Red
  MODIFICADOS: '#10B981', // Green
  SUCCESS: '#10B981',
  ERROR: '#EF4444',
  WARNING: '#F59E0B',
} as const;

// Spacing constants
export const SPACING = {
  CARD_PADDING: {
    SM: 'p-4',
    MD: 'p-6',
    LG: 'p-8',
    XL: 'p-10',
  },
  GAP: {
    SM: 'gap-2',
    MD: 'gap-4',
    LG: 'gap-6',
  },
} as const;

