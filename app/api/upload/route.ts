import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { captureException } from "@/lib/observability";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIME_TO_EXT: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const limit = await checkRateLimit({
      key: `upload:${ip}`,
      limit: 10,
      windowSeconds: 60,
    });
    if (!limit.ok) {
      return apiError("Demasiadas solicitudes. Intentá de nuevo en un minuto.", 429);
    }

    const contentLengthHeader = request.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = Number.parseInt(contentLengthHeader, 10);
      if (Number.isFinite(contentLength) && contentLength > MAX_FILE_SIZE_BYTES + 4096) {
        return apiError("Imagen demasiado grande. Máximo 5 MB.", 413);
      }
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file || typeof file === "string") {
      return apiError("No se proporcionó ningún archivo", 400);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return apiError("Imagen demasiado grande. Máximo 5 MB.", 413);
    }

    if (file.size === 0) {
      return apiError("El archivo está vacío", 400);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return apiError("Tipo de archivo no permitido. Solo JPG, PNG y WebP.", 400);
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const allowedExts = MIME_TO_EXT[file.type] ?? [];
    if (!fileExt || !allowedExts.includes(fileExt)) {
      return apiError("La extensión del archivo no coincide con su tipo.", 400);
    }

    const supabase = await createClient();

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = type === "thumbnail" ? `thumbnails/${fileName}` : `originals/${fileName}`;

    const { data, error } = await supabase.storage
      .from("murales")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      captureException(error, { route: "POST /api/upload" });
      return apiError(error.message, 500);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("murales").getPublicUrl(data.path);

    return apiSuccess({ success: true, url: publicUrl, path: data.path });
  } catch (error) {
    captureException(error, { route: "POST /api/upload" });
    return apiError("Error interno del servidor", 500);
  }
}
