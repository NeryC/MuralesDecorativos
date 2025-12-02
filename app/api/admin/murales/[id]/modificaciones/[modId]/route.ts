import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MURAL_ESTADOS } from '@/lib/constants';
import { registrarAuditoria } from '@/lib/auditoria';

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
      const { data: updatedMod, error: updateModError } = await supabase
        .from('mural_modificaciones')
        .update({
          estado_solicitud: 'rechazada',
          procesado_at: new Date().toISOString(),
        })
        .eq('id', modId)
        .select()
        .single();

      if (updateModError) {
        console.error('Error rejecting modification:', updateModError);
        return NextResponse.json(
          { error: 'No se pudo rechazar la solicitud de modificación', details: updateModError.message },
          { status: 500 }
        );
      }

      if (!updatedMod) {
        console.error('No se encontró la modificación después de actualizar');
        return NextResponse.json(
          { error: 'No se pudo verificar la actualización de la solicitud' },
          { status: 500 }
        );
      }

      // Registrar en auditoría
      await registrarAuditoria({
        accion: 'rechazar_modificacion',
        entidadTipo: 'modificacion',
        entidadId: modId,
        datosAnteriores: {
          estado_solicitud: modificacion.estado_solicitud,
          mural_id: modificacion.mural_id,
        },
        datosNuevos: {
          estado_solicitud: 'rechazada',
          procesado_at: updatedMod.procesado_at,
        },
        comentario: `Modificación rechazada para mural ${id}`,
      });

      return NextResponse.json({ success: true, action: 'reject', data: updatedMod });
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
    // Validar que tenemos los datos necesarios
    if (!modificacion.nueva_imagen_url) {
      return NextResponse.json(
        { error: 'La modificación no tiene una nueva imagen válida' },
        { status: 400 }
      );
    }

    const updateMuralData = {
      imagen_url: modificacion.nueva_imagen_url,
      imagen_thumbnail_url: modificacion.nueva_imagen_thumbnail_url || mural.imagen_thumbnail_url || null,
      comentario:
        modificacion.nuevo_comentario !== null &&
        modificacion.nuevo_comentario !== undefined &&
        modificacion.nuevo_comentario !== ''
          ? modificacion.nuevo_comentario
          : mural.comentario,
      estado: MURAL_ESTADOS.MODIFICADO_APROBADO,
    };

    const { error: updateMuralError } = await supabase
      .from('murales')
      .update(updateMuralData)
      .eq('id', id);

    if (updateMuralError) {
      console.error('Error updating mural with approved modification:', updateMuralError);
      return NextResponse.json(
        { 
          error: 'No se pudo aplicar la modificación al mural', 
          details: updateMuralError.message,
          code: updateMuralError.code 
        },
        { status: 500 }
      );
    }

    // 5) Guardar la imagen original y marcar la solicitud como aprobada en una sola operación
    // Nota: Si los campos imagen_original_url no existen, solo actualizamos el estado
    const updateData: {
      estado_solicitud: string;
      procesado_at: string;
      imagen_original_url?: string;
      imagen_original_thumbnail_url?: string | null;
    } = {
      estado_solicitud: 'aprobada',
      procesado_at: new Date().toISOString(),
    };

    // Intentar agregar los campos de imagen original si existen
    // Si no existen, la actualización seguirá funcionando sin ellos
    try {
      updateData.imagen_original_url = mural.imagen_url;
      updateData.imagen_original_thumbnail_url = mural.imagen_thumbnail_url;
    } catch (e) {
      // Si hay error, continuamos sin estos campos
      console.warn('Could not set original image fields, continuing without them');
    }

    const { data: updatedMod, error: approveModError } = await supabase
      .from('mural_modificaciones')
      .update(updateData)
      .eq('id', modId)
      .select()
      .single();

    if (approveModError) {
      console.error('Error marking modification as approved:', approveModError);
      // Si el error es porque los campos no existen, intentamos sin ellos
      if (approveModError.message?.includes('column') || approveModError.code === '42703') {
        const { data: updatedModFallback, error: fallbackError } = await supabase
          .from('mural_modificaciones')
          .update({
            estado_solicitud: 'aprobada',
            procesado_at: new Date().toISOString(),
          })
          .eq('id', modId)
          .select()
          .single();

        if (fallbackError) {
          return NextResponse.json(
            { error: 'No se pudo marcar la solicitud como aprobada', details: fallbackError.message },
            { status: 500 }
          );
        }

        // Registrar en auditoría para el fallback también
        await registrarAuditoria({
          accion: 'aprobar_modificacion',
          entidadTipo: 'modificacion',
          entidadId: modId,
          datosAnteriores: {
            estado_solicitud: modificacion.estado_solicitud,
            mural_id: modificacion.mural_id,
            mural_estado: mural.estado,
          },
          datosNuevos: {
            estado_solicitud: 'aprobada',
            mural_estado: MURAL_ESTADOS.MODIFICADO_APROBADO,
          },
          comentario: `Modificación aprobada y aplicada al mural ${id} (fallback)`,
        });

        return NextResponse.json({ success: true, action: 'approve' });
      }

      return NextResponse.json(
        { error: 'No se pudo marcar la solicitud como aprobada', details: approveModError.message },
        { status: 500 }
      );
    }

    if (!updatedMod) {
      console.error('No se encontró la modificación después de actualizar');
      return NextResponse.json(
        { error: 'No se pudo verificar la actualización de la solicitud' },
        { status: 500 }
      );
    }

    // 7) Rechazar automáticamente otras solicitudes pendientes del mismo mural
    // Primero obtenemos las IDs de las otras solicitudes pendientes para registrar en auditoría
    const { data: otrasPendientes, error: fetchOthersError } = await supabase
      .from('mural_modificaciones')
      .select('id')
      .eq('mural_id', id)
      .eq('estado_solicitud', 'pendiente')
      .neq('id', modId);

    if (fetchOthersError) {
      console.error('Error fetching other pending modifications:', fetchOthersError);
    } else if (otrasPendientes && otrasPendientes.length > 0) {
      // Actualizar todas las demás solicitudes pendientes a rechazadas
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
      } else {
        // Registrar en auditoría cada solicitud rechazada automáticamente
        for (const otraMod of otrasPendientes) {
          await registrarAuditoria({
            accion: 'rechazar_modificacion',
            entidadTipo: 'modificacion',
            entidadId: otraMod.id,
            datosAnteriores: {
              estado_solicitud: 'pendiente',
              mural_id: id,
            },
            datosNuevos: {
              estado_solicitud: 'rechazada',
              procesado_at: new Date().toISOString(),
            },
            comentario: `Modificación rechazada automáticamente porque se aprobó otra modificación para el mural ${id}`,
          });
        }
      }
    }

    // Registrar en auditoría
    await registrarAuditoria({
      accion: 'aprobar_modificacion',
      entidadTipo: 'modificacion',
      entidadId: modId,
      datosAnteriores: {
        estado_solicitud: modificacion.estado_solicitud,
        mural_id: modificacion.mural_id,
        mural_estado: mural.estado,
        mural_imagen_url: mural.imagen_url,
        mural_comentario: mural.comentario,
      },
      datosNuevos: {
        estado_solicitud: 'aprobada',
        procesado_at: updatedMod.procesado_at,
        mural_estado: MURAL_ESTADOS.MODIFICADO_APROBADO,
        mural_imagen_url: updateMuralData.imagen_url,
        mural_comentario: updateMuralData.comentario,
      },
      comentario: `Modificación aprobada y aplicada al mural ${id}`,
    });

    return NextResponse.json({ success: true, action: 'approve' });
  } catch (error) {
    console.error('Unexpected error processing mural modification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}



