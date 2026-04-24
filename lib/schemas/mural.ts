import { z } from "zod";

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
