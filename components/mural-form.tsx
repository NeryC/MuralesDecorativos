"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ImageUploader from "@/components/image-uploader";
import { MapField } from "@/components/map-field";
import { TurnstileWidget } from "@/components/turnstile";
import { muralSchema, type MuralFormValues } from "@/lib/schemas/mural";
import { useImageUpload } from "@/hooks/use-image-upload";
import { MESSAGES } from "@/lib/messages";
import { env } from "@/lib/env";

export function MuralForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [isSubmitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileSiteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const handleCaptcha = useCallback((t: string | null) => setCaptchaToken(t), []);

  const form = useForm<MuralFormValues>({
    resolver: zodResolver(muralSchema),
    defaultValues: { nombre: "", candidato: "", url_maps: "", comentario: "" },
  });

  const { uploadImage, isUploading } = useImageUpload({
    onError: (msg) => toast.error(msg),
  });

  const onSubmit = async (values: MuralFormValues) => {
    if (!file) {
      toast.error(MESSAGES.VALIDATION.SELECCIONAR_FOTO);
      return;
    }
    if (turnstileSiteKey && !captchaToken) {
      toast.error("Por favor completá el captcha.");
      return;
    }
    setSubmitting(true);
    try {
      const urls = await uploadImage(file);
      if (!urls) return;

      const res = await fetch("/api/murales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          imagen_url: urls.originalUrl,
          imagen_thumbnail_url: urls.thumbnailUrl,
          turnstileToken: captchaToken ?? undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? MESSAGES.ERROR.ENVIAR_MURAL);
      }

      toast.success(MESSAGES.SUCCESS.MURAL_ENVIADO);
      form.reset();
      setFile(null);
      setResetKey((k) => k + 1);
      setTimeout(() => router.push("/"), 1200);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : MESSAGES.ERROR.ENVIAR_MURAL);
    } finally {
      setSubmitting(false);
    }
  };

  const busy = isSubmitting || isUploading;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">
              Nombre del lugar <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              {...form.register("nombre")}
              aria-invalid={!!form.formState.errors.nombre}
              aria-describedby={form.formState.errors.nombre ? "nombre-err" : undefined}
            />
            {form.formState.errors.nombre && (
              <p id="nombre-err" role="alert" className="text-sm text-destructive">
                {form.formState.errors.nombre.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="candidato">Candidato (opcional)</Label>
            <Input id="candidato" placeholder="Ej: Juan Pérez" {...form.register("candidato")} />
            {form.formState.errors.candidato && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.candidato.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="url_maps">
              Ubicación <span className="text-destructive">*</span>
            </Label>
            <MapField
              key={resetKey}
              value={form.watch("url_maps")}
              onLocationSelect={(url) => form.setValue("url_maps", url, { shouldValidate: true })}
              initialZoom={13}
            />
            {form.formState.errors.url_maps && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.url_maps.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comentario">Comentario (opcional)</Label>
            <Textarea id="comentario" rows={4} {...form.register("comentario")} />
            {form.formState.errors.comentario && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.comentario.message}
              </p>
            )}
          </div>
        </div>

        <ImageUploader
          onFileSelect={setFile}
          onError={(msg) => toast.error(msg)}
          disabled={busy}
          resetKey={resetKey}
        />
      </div>

      {turnstileSiteKey && (
        <div className="flex justify-start">
          <TurnstileWidget siteKey={turnstileSiteKey} onToken={handleCaptcha} />
        </div>
      )}

      <div className="sticky bottom-0 sm:static flex justify-end gap-3 pt-4 border-t bg-background">
        <Button type="button" variant="outline" onClick={() => router.push("/")} disabled={busy}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? (
            <>Enviando...</>
          ) : (
            <>
              <Send className="size-4" aria-hidden="true" />
              Enviar mural
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
