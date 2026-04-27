import { z } from "zod";
import { env } from "@/lib/env";

export const muralSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(200, "Máximo 200 caracteres"),
  candidato: z.string().trim().max(200, "Máximo 200 caracteres").optional().or(z.literal("")),
  url_maps: z
    .string()
    .trim()
    .url("URL inválida")
    .refine(
      (v) => v.includes("google.com/maps") || v.includes("maps.app.goo.gl"),
      "Debe ser un enlace de Google Maps",
    ),
  comentario: z.string().trim().max(2000, "Máximo 2000 caracteres").optional().or(z.literal("")),
});

export type MuralFormValues = z.infer<typeof muralSchema>;

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

export const muralCreateApiSchema = muralSchema.extend({
  imagen_url: supabaseImageUrl,
  imagen_thumbnail_url: supabaseImageUrl.nullish(),
  turnstileToken: z.string().min(1).max(2048).optional(),
});

export type MuralCreateApiPayload = z.infer<typeof muralCreateApiSchema>;
