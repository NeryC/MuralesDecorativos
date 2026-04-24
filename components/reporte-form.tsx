"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ImageUploader from "@/components/image-uploader";
import { reporteSchema, type ReporteFormValues } from "@/lib/schemas/reporte";
import { useImageUpload } from "@/hooks/use-image-upload";
import { MESSAGES } from "@/lib/messages";

interface ReporteFormProps {
  muralId: string;
  muralName: string;
}

export function ReporteForm({ muralId, muralName }: ReporteFormProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const form = useForm<ReporteFormValues>({
    resolver: zodResolver(reporteSchema),
    defaultValues: { tipo: "eliminacion", motivo: "" },
  });

  const { uploadImage, isUploading } = useImageUpload({
    onError: (msg) => toast.error(msg),
  });

  const tipo = form.watch("tipo");

  const onSubmit = async (values: ReporteFormValues) => {
    setBusy(true);
    try {
      let imagen_url: string | undefined;
      let imagen_thumbnail_url: string | undefined;

      if (values.tipo === "modificacion" && file) {
        const urls = await uploadImage(file);
        if (!urls) return;
        imagen_url = urls.originalUrl;
        imagen_thumbnail_url = urls.thumbnailUrl;
      }

      const res = await fetch(`/api/murales/${muralId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, imagen_url, imagen_thumbnail_url }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Error al enviar el reporte");
      }

      toast.success(MESSAGES.SUCCESS.REPORTE_ENVIADO ?? "Reporte enviado");
      form.reset();
      setFile(null);
      setResetKey((k) => k + 1);
      setTimeout(() => router.push("/"), 1200);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar el reporte");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="rounded-md border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">Reportando mural:</p>
        <p className="font-medium">{muralName}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Tipo de reporte</Label>
        <RadioGroup
          value={tipo}
          onValueChange={(v) =>
            form.setValue("tipo", v as "eliminacion" | "modificacion", { shouldValidate: true })
          }
          className="flex flex-col gap-2"
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="eliminacion" id="eliminacion" />
            <span>Fue eliminado</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="modificacion" id="modificacion" />
            <span>Fue modificado</span>
          </label>
        </RadioGroup>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="motivo">
          Motivo <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="motivo"
          rows={4}
          {...form.register("motivo")}
          aria-invalid={!!form.formState.errors.motivo}
        />
        {form.formState.errors.motivo && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.motivo.message}
          </p>
        )}
      </div>

      {tipo === "modificacion" && (
        <ImageUploader
          onFileSelect={setFile}
          onError={(msg) => toast.error(msg)}
          disabled={busy || isUploading}
          resetKey={resetKey}
        />
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.push("/")} disabled={busy}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy || isUploading}>
          <Send className="size-4" aria-hidden="true" />
          {busy ? "Enviando..." : "Enviar reporte"}
        </Button>
      </div>
    </form>
  );
}
