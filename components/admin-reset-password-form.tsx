"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const schema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });

type Values = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data, error }) => {
      setHasSession(!error && !!data.user);
    });
  }, []);

  const onSubmit = async (values: Values) => {
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) {
        toast.error(error.message ?? "No se pudo actualizar la contraseña");
        return;
      }
      toast.success("Contraseña actualizada. Iniciando sesión...");
      router.push("/admin");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (hasSession === false) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          El enlace expiró o no es válido. Volvé al login y pedí un nuevo enlace.
        </p>
        <Button variant="outline" onClick={() => router.push("/admin/login")} className="w-full">
          Volver al login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">Repetir contraseña</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          {...form.register("confirm")}
        />
        {form.formState.errors.confirm && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.confirm.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={busy || hasSession === null} className="w-full">
        <KeyRound className="size-4" aria-hidden="true" />
        {busy ? "Guardando..." : "Guardar contraseña"}
      </Button>
    </form>
  );
}
