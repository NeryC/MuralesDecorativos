import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MURAL_ESTADOS } from '@/lib/constants';

/**
 * POST /api/murales/[id]/report
 * Reporta un mural como eliminado o modificado
 *
 * Reglas:
 * - Un mural puede recibir múltiples solicitudes de modificación mientras
 *   NO esté aún marcado como modificado_aprobado.
 * - Una vez que el mural está en estado MODIFICADO_APROBADO, ya no se aceptan
 *   nuevas solicitudes de modificación.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nuevo_comentario, nueva_imagen_url, nueva_imagen_thumbnail_url } = body;

    if (!nueva_imagen_url) {
      return NextResponse.json(
        { error: 'La nueva imagen es requerida' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1) Verificar el estado actual del mural
    const { data: muralActual, error: fetchError } = await supabase
      .from('murales')
      .select('id, estado')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching mural before report:', fetchError);
      return NextResponse.json(
        { error: 'No se pudo obtener el mural para validar el reporte' },
        { status: 500 }
      );
    }

    if (!muralActual) {
      return NextResponse.json({ error: 'Mural no encontrado' }, { status: 404 });
    }

    // 2) Si ya fue modificado y aprobado, bloquear nuevas solicitudes
    if (muralActual.estado === MURAL_ESTADOS.MODIFICADO_APROBADO) {
      return NextResponse.json(
        {
          error:
            'El mural ya fue modificado y aprobado. No se pueden crear más solicitudes de modificación.',
        },
        { status: 400 }
      );
    }

    // 3) Registrar una NUEVA solicitud de modificación (no sobreescribimos campos en la tabla de murales)
    const { data, error } = await supabase
      .from('mural_modificaciones')
      .insert([
        {
          mural_id: muralActual.id,
          nuevo_comentario: nuevo_comentario || null,
          nueva_imagen_url,
          nueva_imagen_thumbnail_url: nueva_imagen_thumbnail_url || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error reporting mural:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Mural no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
