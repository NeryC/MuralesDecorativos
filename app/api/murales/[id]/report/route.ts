import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MURAL_ESTADOS } from '@/lib/constants';

/**
 * POST /api/murales/[id]/report
 * Reporta un mural como eliminado o modificado
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

    const { data, error } = await supabase
      .from('murales')
      .update({
        estado: MURAL_ESTADOS.MODIFICADO_PENDIENTE,
        nuevo_comentario: nuevo_comentario || null,
        nueva_imagen_url,
        nueva_imagen_thumbnail_url: nueva_imagen_thumbnail_url || null,
        reportado_at: new Date().toISOString(),
      })
      .eq('id', id)
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
