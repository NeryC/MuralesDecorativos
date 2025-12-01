import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MURAL_ESTADOS } from '@/lib/constants';

/**
 * PATCH /api/admin/murales/[id]/modificaciones/[modId]
 * Aprueba o rechaza una solicitud de modificación específica de un mural.
 *
 * Body:
 * { action: 'approve' | 'reject' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; modId: string }> }
) {
  try {
    const { id, modId } = await params;
    const body = await request.json();
    const { action } = body as { action?: 'approve' | 'reject' };

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json(
        { error: 'La acción es requerida y debe ser "approve" o "reject"' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1) Traer mural y la modificación específica
    const { data: modificacion, error: modError } = await supabase
      .from('mural_modificaciones')
      .select('*')
      .eq('id', modId)
      .eq('mural_id', id)
      .single();

    if (modError) {
      console.error('Error fetching mural_modificacion:', modError);
      return NextResponse.json(
        { error: 'No se encontró la solicitud de modificación' },
        { status: 404 }
      );
    }

    if (!modificacion) {
      return NextResponse.json(
        { error: 'Solicitud de modificación no encontrada' },
        { status: 404 }
      );
    }

    if (modificacion.estado_solicitud !== 'pendiente') {
      return NextResponse.json(
        { error: 'Solo se pueden procesar solicitudes pendientes' },
        { status: 400 }
      );
    }

    // 2) Si la acción es rechazar, sólo actualizamos la solicitud
    if (action === 'reject') {
      const { error: updateModError } = await supabase
        .from('mural_modificaciones')
        .update({
          estado_solicitud: 'rechazada',
          procesado_at: new Date().toISOString(),
        })
        .eq('id', modId);

      if (updateModError) {
        console.error('Error rejecting modification:', updateModError);
        return NextResponse.json(
          { error: 'No se pudo rechazar la solicitud de modificación' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, action: 'reject' });
    }

    // 3) Acción: approve
    // Traer el mural actual para poder combinar datos (comentario actual, etc.)
    const { data: mural, error: muralError } = await supabase
      .from('murales')
      .select('*')
      .eq('id', id)
      .single();

    if (muralError || !mural) {
      console.error('Error fetching mural for approval:', muralError);
      return NextResponse.json(
        { error: 'No se pudo obtener el mural para aprobar la modificación' },
        { status: 500 }
      );
    }

    if (mural.estado === MURAL_ESTADOS.MODIFICADO_APROBADO) {
      return NextResponse.json(
        {
          error:
            'El mural ya fue modificado y aprobado. No se pueden aprobar más solicitudes.',
        },
        { status: 400 }
      );
    }

    // 4) Aplicar los cambios de la solicitud al mural
    const { error: updateMuralError } = await supabase
      .from('murales')
      .update({
        imagen_url: modificacion.nueva_imagen_url,
        imagen_thumbnail_url: modificacion.nueva_imagen_thumbnail_url || mural.imagen_thumbnail_url,
        comentario:
          modificacion.nuevo_comentario !== null &&
          modificacion.nuevo_comentario !== undefined &&
          modificacion.nuevo_comentario !== ''
            ? modificacion.nuevo_comentario
            : mural.comentario,
        estado: MURAL_ESTADOS.MODIFICADO_APROBADO,
      })
      .eq('id', id);

    if (updateMuralError) {
      console.error('Error updating mural with approved modification:', updateMuralError);
      return NextResponse.json(
        { error: 'No se pudo aplicar la modificación al mural' },
        { status: 500 }
      );
    }

    // 5) Marcar la solicitud como aprobada
    const { error: approveModError } = await supabase
      .from('mural_modificaciones')
      .update({
        estado_solicitud: 'aprobada',
        procesado_at: new Date().toISOString(),
      })
      .eq('id', modId);

    if (approveModError) {
      console.error('Error marking modification as approved:', approveModError);
      return NextResponse.json(
        { error: 'No se pudo marcar la solicitud como aprobada' },
        { status: 500 }
      );
    }

    // 6) Opcional: marcar otras solicitudes pendientes del mismo mural como rechazadas
    const { error: rejectOthersError } = await supabase
      .from('mural_modificaciones')
      .update({
        estado_solicitud: 'rechazada',
        procesado_at: new Date().toISOString(),
      })
      .eq('mural_id', id)
      .eq('estado_solicitud', 'pendiente')
      .neq('id', modId);

    if (rejectOthersError) {
      console.error(
        'Error rejecting other pending modifications for mural:',
        rejectOthersError
      );
      // No hacemos return 500 para no romper el flujo principal;
      // simplemente lo registramos.
    }

    return NextResponse.json({ success: true, action: 'approve' });
  } catch (error) {
    console.error('Unexpected error processing mural modification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


