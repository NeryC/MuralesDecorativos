import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { MURAL_ESTADOS } from "@/lib/constants";
import { apiError, apiSuccess } from "@/lib/api-response";
import { muralCreateApiSchema } from "@/lib/schemas/mural";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { captureException } from "@/lib/observability";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyNewMuralPending } from "@/lib/email";

export const runtime = "nodejs";

const PAGE_SIZE_DEFAULT = 200;
const PAGE_SIZE_MAX = 500;

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX).default(PAGE_SIZE_DEFAULT),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * GET /api/murales
 * Lista paginada de murales públicamente visibles.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const parsed = listQuerySchema.safeParse({
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    });
    if (!parsed.success) {
      return apiError("Parámetros de paginación inválidos", 400);
    }
    const { limit, offset } = parsed.data;

    const supabase = await createClient();

    const { data, error, count } = await supabase
      .from("murales")
      .select("*, mural_modificaciones(*)", { count: "exact" })
      .in("estado", [
        MURAL_ESTADOS.APROBADO,
        MURAL_ESTADOS.MODIFICADO_APROBADO,
        MURAL_ESTADOS.MODIFICADO_PENDIENTE,
      ])
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      captureException(error, { route: "GET /api/murales" });
      return apiError(error.message, 500);
    }

    return apiSuccess({
      data: data ?? [],
      pagination: {
        limit,
        offset,
        total: count ?? 0,
        nextOffset: offset + (data?.length ?? 0) < (count ?? 0) ? offset + limit : null,
      },
    });
  } catch (error) {
    captureException(error, { route: "GET /api/murales" });
    return apiError("Error interno del servidor", 500);
  }
}

/**
 * POST /api/murales — crea un mural pendiente. Validado con zod + Turnstile.
 */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const limit = await checkRateLimit({
      key: `murales:create:${ip}`,
      limit: 5,
      windowSeconds: 60,
    });
    if (!limit.ok) {
      return apiError("Demasiadas solicitudes. Intentá de nuevo en un minuto.", 429);
    }

    const raw = await request.json().catch(() => null);
    const parsed = muralCreateApiSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return apiError(first?.message ?? "Body inválido", 400);
    }
    const body = parsed.data;

    const captcha = await verifyTurnstileToken(body.turnstileToken, ip);
    if (!captcha.ok) {
      return apiError(captcha.reason, 400);
    }

    const supabase = await createClient();

    const { error } = await supabase.from("murales").insert([
      {
        nombre: body.nombre,
        candidato: body.candidato || null,
        url_maps: body.url_maps,
        comentario: body.comentario || null,
        imagen_url: body.imagen_url,
        imagen_thumbnail_url: body.imagen_thumbnail_url || null,
        estado: MURAL_ESTADOS.PENDIENTE,
      },
    ]);

    if (error) {
      captureException(error, { route: "POST /api/murales" });
      return apiError(error.message, 500);
    }

    void notifyNewMuralPending({
      nombre: body.nombre,
      candidato: body.candidato,
      comentario: body.comentario,
      url_maps: body.url_maps,
      imagen_url: body.imagen_url,
    });

    return apiSuccess({ success: true }, 201);
  } catch (error) {
    captureException(error, { route: "POST /api/murales" });
    return apiError("Error interno del servidor", 500);
  }
}
