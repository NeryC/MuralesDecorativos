import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MURAL_ESTADOS } from "@/lib/constants";
import { apiError, apiSuccess } from "@/lib/api-response";

export const runtime = "nodejs";

/**
 * GET /api/murales
 * Obtiene todos los murales aprobados para mostrar en el mapa público
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("murales")
      .select("*, mural_modificaciones(*)")
      .in("estado", [
        MURAL_ESTADOS.APROBADO,
        MURAL_ESTADOS.MODIFICADO_APROBADO,
        MURAL_ESTADOS.MODIFICADO_PENDIENTE,
      ])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching murales:", error);
      return apiError(error.message, 500);
    }

    return apiSuccess(data || []);
  } catch (error) {
    console.error("Unexpected error:", error);
    return apiError("Error interno del servidor", 500);
  }
}

/**
 * POST /api/murales
 * Crea un nuevo mural (estado: pendiente)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, candidato, url_maps, comentario, imagen_url, imagen_thumbnail_url } = body;

    // Validaciones
    if (!nombre || !url_maps || !imagen_url) {
      return apiError("Faltan campos requeridos: nombre, url_maps, imagen_url", 400);
    }

    const supabase = await createClient();

    // Importante: no usamos .select() aquí para evitar que RLS bloquee el SELECT
    // sobre filas con estado 'pendiente'. Solo necesitamos que el INSERT tenga éxito.
    const { error } = await supabase.from("murales").insert([
      {
        nombre,
        candidato: candidato || null,
        url_maps,
        comentario: comentario || null,
        imagen_url,
        imagen_thumbnail_url: imagen_thumbnail_url || null,
        estado: MURAL_ESTADOS.PENDIENTE,
      },
    ]);

    if (error) {
      console.error("Error creating mural:", error);
      return apiError(error.message, 500);
    }

    return apiSuccess({ success: true }, 201);
  } catch (error) {
    console.error("Unexpected error:", error);
    return apiError("Error interno del servidor", 500);
  }
}
