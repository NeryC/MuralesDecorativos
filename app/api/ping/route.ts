import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api-response";

export const runtime = "nodejs";

/**
 * GET /api/ping
 * Endpoint liviano para mantener el proyecto de Supabase activo en el free tier.
 * Hace un COUNT sobre la tabla murales — suficiente para que Supabase no pause el proyecto.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("murales")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    return apiSuccess({ ok: true, murales: count ?? 0 });
  } catch {
    return apiError("ping failed", 500);
  }
}
