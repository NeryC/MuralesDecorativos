export type MuralEstado = 
  | 'pendiente' 
  | 'aprobado' 
  | 'rechazado' 
  | 'modificado_pendiente' 
  | 'modificado_aprobado';

export interface Mural {
  id: string;
  created_at: string;
  nombre: string;
  candidato?: string | null;
  url_maps: string;
  comentario?: string | null;
  imagen_url: string;
  imagen_thumbnail_url?: string | null;
  estado: MuralEstado;
  
  // Campos para reportes de eliminación/modificación
  nuevo_comentario?: string | null;
  nueva_imagen_url?: string | null;
  nueva_imagen_thumbnail_url?: string | null;
  reportado_at?: string | null;
  
  updated_at: string;
}

export interface MuralModificacion {
  id: string;
  created_at: string;
  mural_id: string;
  nuevo_comentario?: string | null;
  nueva_imagen_url: string;
  nueva_imagen_thumbnail_url?: string | null;
  imagen_original_url?: string | null;
  imagen_original_thumbnail_url?: string | null;
  estado_solicitud: 'pendiente' | 'aprobada' | 'rechazada';
  procesado_at?: string | null;
  reportado_at?: string | null;
}

export interface MuralWithModificaciones extends Mural {
  mural_modificaciones?: MuralModificacion[];
}

export interface CreateMuralDTO {
  nombre: string;
  candidato?: string;
  url_maps: string;
  comentario?: string;
  imagen_url: string;
  imagen_thumbnail_url?: string;
}

export interface ReportMuralDTO {
  nuevo_comentario?: string;
  nueva_imagen_url: string;
  nueva_imagen_thumbnail_url?: string;
}

export interface UpdateMuralEstadoDTO {
  estado: MuralEstado;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export type AccionAuditoria =
  | 'aprobar_mural'
  | 'rechazar_mural'
  | 'aprobar_modificacion'
  | 'rechazar_modificacion'
  | 'actualizar_estado';

export interface Auditoria {
  id: string;
  created_at: string;
  usuario_id?: string | null;
  usuario_email?: string | null;
  usuario_nombre?: string | null;
  accion: AccionAuditoria;
  entidad_tipo: 'mural' | 'modificacion';
  entidad_id: string;
  datos_anteriores?: Record<string, unknown> | null;
  datos_nuevos?: Record<string, unknown> | null;
  comentario?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}
