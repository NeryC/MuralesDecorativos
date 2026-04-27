import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MURAL_ESTADOS } from "@/lib/constants";
import { apiError, apiSuccess } from "@/lib/api-response";
import { reporteApiSchema } from "@/lib/schemas/reporte";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { captureException } from "@/lib/observability";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/murales/[id]/report
 * Reporta un mural como eliminado o modificado.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const limit = await checkRateLimit({
      key: `murales:report:${ip}`,
      limit: 5,
      windowSeconds: 60,
    });
    if (!limit.ok) {
      return apiError("Demasiadas solicitudes. Intentá de nuevo en un minuto.", 429);
    }

    const raw = await request.json().catch(() => null);
    const parsed = reporteApiSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return apiError(first?.message ?? "Body inválido", 400);
    }
    const body = parsed.data;

    const captcha = await verifyTurnstileToken(body.turnstileToken, ip);
    if (!captcha.ok) {
      return apiError(captcha.reason, 400);
    }

    const nuevaImagenUrl = body.nueva_imagen_url ?? body.imagen_url ?? null;
    const nuevaImagenThumbUrl =
      body.nueva_imagen_thumbnail_url ?? body.imagen_thumbnail_url ?? null;
    const nuevoComentario = body.nuevo_comentario ?? body.motivo ?? null;

    const supabase = await createClient();

    const { data: muralActual, error: fetchError } = await supabase
      .from("murales")
      .select("id, estado")
      .eq("id", id)
      .single();

    if (fetchError) {
      captureException(fetchError, { route: "POST /api/murales/[id]/report" });
      return apiError("No se pudo obtener el mural para validar el reporte", 500);
    }

    if (!muralActual) {
      return apiError("Mural no encontrado", 404);
    }

    if (muralActual.estado === MURAL_ESTADOS.MODIFICADO_APROBADO) {
      return apiError(
        "El mural ya fue modificado y aprobado. No se pueden crear más solicitudes de modificación.",
        400,
      );
    }

    if (body.tipo === "eliminacion") {
      const comentarioEliminacion = nuevoComentario
        ? `Reporte de eliminación: ${nuevoComentario}`
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
        captureException(error, { route: "POST /api/murales/[id]/report:eliminacion" });
        return apiError(error.message, 500);
      }

      const { error: updError } = await supabase
        .from("murales")
        .update({ estado: "modificado_pendiente" })
        .eq("id", muralActual.id);

      if (updError) {
        captureException(updError, { route: "POST /api/murales/[id]/report:eliminacion-update" });
        return apiError("Error al registrar el reporte de eliminación", 500);
      }

      return apiSuccess({ success: true, data });
    }

    const { data, error } = await supabase
      .from("mural_modificaciones")
      .insert([
        {
          mural_id: muralActual.id,
          nuevo_comentario: nuevoComentario,
          nueva_imagen_url: nuevaImagenUrl,
          nueva_imagen_thumbnail_url: nuevaImagenThumbUrl,
        },
      ])
      .select()
      .single();

    if (error) {
      captureException(error, { route: "POST /api/murales/[id]/report:modificacion" });
      return apiError(error.message, 500);
    }

    return apiSuccess({ success: true, data });
  } catch (error) {
    captureException(error, { route: "POST /api/murales/[id]/report" });
    return apiError("Error interno del servidor", 500);
  }
}
