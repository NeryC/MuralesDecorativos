import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';
import { registrarAuditoria } from '@/lib/auditoria';
import { apiError, apiSuccess } from '@/lib/api-response';

const updateSchema = z.object({
  estado: z.enum(['pendiente', 'aprobado', 'rechazado']),
});

/**
 * GET /api/murales/[id]
 * Obtiene un mural específico por ID (incluye modificaciones)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('murales')
      .select('*, mural_modificaciones(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching mural:', error);
      return apiError(error.message, 500);
    }

    if (!data) {
      return apiError('Mural no encontrado', 404);
    }

    return apiSuccess(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return apiError('Error interno del servidor', 500);
  }
}

/**
 * PATCH /api/murales/[id]
 * Actualiza el estado de un mural (aprobar/rechazar)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user;

    const { id } = await params;
    const body = await request.json();

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Body inválido', 400);
    }
    const { estado } = parsed.data;

    const supabase = await createClient();

    // Obtener el estado anterior para auditoría
    const { data: muralAnterior } = await supabase
      .from('murales')
      .select('estado, nombre')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('murales')
      .update({ estado })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating mural:', error);
      return apiError(error.message, 500);
    }

    if (!data) {
      return apiError('Mural no encontrado', 404);
    }

    const accion = estado === 'aprobado' ? 'aprobar_mural' : estado === 'rechazado' ? 'rechazar_mural' : 'actualizar_estado';
    const auditoriaOk = await registrarAuditoria({
      accion,
      entidadTipo: 'mural',
      entidadId: id,
      datosAnteriores: muralAnterior ? { estado: muralAnterior.estado } : undefined,
      datosNuevos: { estado },
      comentario: `Estado del mural "${muralAnterior?.nombre || id}" actualizado a ${estado} por ${user.email}`,
    });

    const responseBody = auditoriaOk
      ? { success: true, data }
      : { success: true, data, _auditWarning: 'Acción completada pero no se pudo registrar en auditoría.' };
    return apiSuccess(responseBody);
  } catch (error) {
    console.error('Unexpected error:', error);
    return apiError('Error interno del servidor', 500);
  }
}
