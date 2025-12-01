import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { registrarAuditoria } from '@/lib/auditoria';

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Mural no encontrado' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
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
    const { id } = await params;
    const body = await request.json();
    const { estado } = body;

    if (!estado) {
      return NextResponse.json({ error: 'El campo estado es requerido' }, { status: 400 });
    }

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Mural no encontrado' }, { status: 404 });
    }

    // Registrar en auditoría (intentará obtener el usuario si está autenticado)
    const referer = request.headers.get('referer');
    const isAdminRequest = referer?.includes('/admin');
    if (isAdminRequest) {
      const accion = estado === 'aprobado' ? 'aprobar_mural' : estado === 'rechazado' ? 'rechazar_mural' : 'actualizar_estado';
      await registrarAuditoria({
        accion,
        entidadTipo: 'mural',
        entidadId: id,
        datosAnteriores: muralAnterior ? { estado: muralAnterior.estado } : undefined,
        datosNuevos: { estado },
        comentario: `Estado del mural "${muralAnterior?.nombre || id}" actualizado a ${estado}`,
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
