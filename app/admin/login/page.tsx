import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión · Admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Panel de administración</CardTitle>
          <CardDescription>Ingresá con tu cuenta de administrador.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <AdminLoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
