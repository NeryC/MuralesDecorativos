"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type Values = z.infer<typeof schema>;

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/admin";
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onForgotPassword = async () => {
    const email = form.getValues("email").trim();
    if (!email || !z.string().email().safeParse(email).success) {
      toast.error("Ingresá tu email arriba antes de pedir el reset.");
      form.setFocus("email");
      return;
    }
    setResetting(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/admin/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        toast.error(error.message ?? "No se pudo enviar el correo de reset.");
        return;
      }
      toast.success("Te enviamos un correo con el enlace para definir nueva contraseña.");
    } finally {
      setResetting(false);
    }
  };

  const onSubmit = async (values: Values) => {
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) {
        toast.error(error.message ?? "Error al iniciar sesión");
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="username" {...form.register("email")} />
        {form.formState.errors.email && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={busy} className="w-full">
        <LogIn className="size-4" aria-hidden="true" />
        {busy ? "Ingresando..." : "Ingresar"}
      </Button>

      <button
        type="button"
        onClick={onForgotPassword}
        disabled={resetting || busy}
        className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline self-center"
      >
        {resetting ? "Enviando..." : "¿Olvidaste tu contraseña?"}
      </button>
    </form>
  );
}
