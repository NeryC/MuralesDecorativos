import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MURAL_ESTADOS } from "@/lib/constants";
import { apiError, apiSuccess } from "@/lib/api-response";

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
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tipo, nuevo_comentario, nueva_imagen_url, nueva_imagen_thumbnail_url } = body;

    // For modification reports an image is required; for elimination it is not
    if (tipo !== "eliminacion" && !nueva_imagen_url) {
      return apiError("La nueva imagen es requerida", 400);
    }

    const supabase = await createClient();

    // 1) Verificar el estado actual del mural
    const { data: muralActual, error: fetchError } = await supabase
      .from("murales")
      .select("id, estado")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching mural before report:", fetchError);
      return apiError("No se pudo obtener el mural para validar el reporte", 500);
    }

    if (!muralActual) {
      return apiError("Mural no encontrado", 404);
    }

    // 2) Si ya fue modificado y aprobado, bloquear nuevas solicitudes
    if (muralActual.estado === MURAL_ESTADOS.MODIFICADO_APROBADO) {
      return apiError(
        "El mural ya fue modificado y aprobado. No se pueden crear más solicitudes de modificación.",
        400,
      );
    }

    // 3a) Para reportes de eliminación: registrar sin imagen y marcar el mural para revisión
    if (tipo === "eliminacion") {
      const comentarioEliminacion = nuevo_comentario
        ? `Reporte de eliminación: ${nuevo_comentario}`
        : "Reporte de eliminación";

      const { data, error } = await supabase
        .from("mural_modificaciones")
        .insert([
          {
            mural_id: muralActual.id,
            nuevo_comentario: comentarioEliminacion,
            nueva_imagen_url: null,
            nueva_imagen_thumbnail_url: null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error reporting mural elimination:", error);
        return apiError(error.message, 500);
      }

      if (!data) {
        return apiError("Mural no encontrado", 404);
      }

      // Mark mural as pending admin review
      const { error: updError } = await supabase
        .from("murales")
        .update({ estado: "modificado_pendiente" })
        .eq("id", muralActual.id);

      if (updError) {
        console.error("[report/eliminacion]", updError);
        return apiError("Error al registrar el reporte de eliminación", 500);
      }

      return apiSuccess({ success: true, data });
    }

    // 3b) Registrar una NUEVA solicitud de modificación (no sobreescribimos campos en la tabla de murales)
    const { data, error } = await supabase
      .from("mural_modificaciones")
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
      console.error("Error reporting mural:", error);
      return apiError(error.message, 500);
    }

    if (!data) {
      return apiError("Mural no encontrado", 404);
    }

    return apiSuccess({ success: true, data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return apiError("Error interno del servidor", 500);
  }
}
