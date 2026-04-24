import { z } from "zod";

export const reporteSchema = z.object({
  tipo: z.enum(["eliminacion", "modificacion"], {
    message: "Seleccioná el tipo de reporte",
  }),
  motivo: z
    .string()
    .trim()
    .min(5, "Al menos 5 caracteres")
    .max(1000, "Máximo 1000 caracteres"),
});

export type ReporteFormValues = z.infer<typeof reporteSchema>;
