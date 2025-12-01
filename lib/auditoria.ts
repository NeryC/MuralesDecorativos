import { createClient } from '@/lib/supabase/server';
import type { AccionAuditoria } from '@/lib/types';
import { getAuthenticatedUser } from './auth/server';
import { headers } from 'next/headers';

interface RegistrarAuditoriaParams {
  accion: AccionAuditoria;
  entidadTipo: 'mural' | 'modificacion';
  entidadId: string;
  datosAnteriores?: Record<string, unknown>;
  datosNuevos?: Record<string, unknown>;
  comentario?: string;
}

/**
 * Registra una acción en el historial de auditoría
 */
export async function registrarAuditoria(params: RegistrarAuditoriaParams): Promise<void> {
  try {
    const user = await getAuthenticatedUser();
    const headersList = await headers();
    
    const supabase = await createClient();

    const auditoriaData = {
      usuario_id: user?.id || null,
      usuario_email: user?.email || null,
      usuario_nombre: user?.name || null,
      accion: params.accion,
      entidad_tipo: params.entidadTipo,
      entidad_id: params.entidadId,
      datos_anteriores: params.datosAnteriores || null,
      datos_nuevos: params.datosNuevos || null,
      comentario: params.comentario || null,
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null,
      user_agent: headersList.get('user-agent') || null,
    };

    const { error } = await supabase.from('auditoria').insert(auditoriaData);

    if (error) {
      console.error('Error registrando auditoría:', error);
      // No lanzamos error para no interrumpir el flujo principal
      // pero lo registramos en consola
    }
  } catch (error) {
    console.error('Error inesperado al registrar auditoría:', error);
    // No lanzamos error para no interrumpir el flujo principal
  }
}

