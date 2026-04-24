import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api-response";

export const runtime = "nodejs";

/**
 * GET /api/admin/auditoria
 * Obtiene el historial de auditoría
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const entidadId = searchParams.get("entidad_id");
    const entidadTipo = searchParams.get("entidad_tipo");

    const supabase = await createClient();

    let query = supabase
      .from("auditoria")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (entidadId) {
      query = query.eq("entidad_id", entidadId);
    }

    if (entidadTipo) {
      query = query.eq("entidad_tipo", entidadTipo);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching auditoria:", error);
      return apiError("Error al obtener el historial de auditoría", 500);
    }

    return apiSuccess(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Unexpected error:", error);
    return apiError("Error interno del servidor", 500);
  }
}
