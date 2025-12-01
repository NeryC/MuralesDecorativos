// Coordenadas por defecto (Asunción, Paraguay)
export const DEFAULT_COORDINATES = {
  lat: -25.3085,
  lng: -57.6056,
  zoom: 50,
};

// Configuración de compresión de imágenes
export const IMAGE_COMPRESSION = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.7,
  thumbnailMaxWidth: 300,
  thumbnailMaxHeight: 300,
  thumbnailQuality: 0.6,
};

// Estados de murales
export const MURAL_ESTADOS = {
  PENDIENTE: 'pendiente',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
  MODIFICADO_PENDIENTE: 'modificado_pendiente',
  MODIFICADO_APROBADO: 'modificado_aprobado',
} as const;
