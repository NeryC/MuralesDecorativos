import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api-response";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIME_TO_EXT: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return apiError("No se proporcionó ningún archivo", 400);
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
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (error) {
      console.error("Error uploading file:", error);
      return apiError(error.message, 500);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("murales").getPublicUrl(data.path);

    return apiSuccess({ success: true, url: publicUrl, path: data.path });
  } catch (error) {
    console.error("Unexpected error:", error);
    return apiError("Error interno del servidor", 500);
  }
}
