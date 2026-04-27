import { z } from "zod";
import { env } from "@/lib/env";

export const reporteSchema = z.object({
  tipo: z.enum(["eliminacion", "modificacion"], {
    message: "Seleccioná el tipo de reporte",
  }),
  motivo: z.string().trim().min(5, "Al menos 5 caracteres").max(1000, "Máximo 1000 caracteres"),
});

export type ReporteFormValues = z.infer<typeof reporteSchema>;

const supabasePublicUrlPattern = (() => {
  try {
    const host = new URL(env.NEXT_PUBLIC_SUPABASE_URL).host.replace(/\./g, "\\.");
    return new RegExp(`^https://${host}/storage/v1/object/public/murales/`);
  } catch {
    return /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/murales\//;
  }
})();

const supabaseImageUrl = z
  .string()
  .url()
  .max(500)
  .regex(supabasePublicUrlPattern, "La URL de imagen debe pertenecer al storage de Supabase");

export const reporteApiSchema = z
  .object({
    tipo: z.enum(["eliminacion", "modificacion"]),
    motivo: z.string().trim().max(1000).optional(),
    nuevo_comentario: z.string().trim().max(1000).optional(),
    imagen_url: supabaseImageUrl.optional(),
    imagen_thumbnail_url: supabaseImageUrl.optional(),
    nueva_imagen_url: supabaseImageUrl.optional(),
    nueva_imagen_thumbnail_url: supabaseImageUrl.optional(),
    turnstileToken: z.string().min(1).max(2048).optional(),
  })
  .refine(
    (v) => v.tipo === "eliminacion" || !!(v.nueva_imagen_url || v.imagen_url),
    "La nueva imagen es requerida para reportes de modificación",
  );

export type ReporteApiPayload = z.infer<typeof reporteApiSchema>;
