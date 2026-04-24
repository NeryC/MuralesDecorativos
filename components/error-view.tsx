"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorViewProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorView({
  title = "Algo salió mal",
  description = "Ocurrió un error al cargar esta página. Podés reintentar o volver al inicio.",
  onRetry,
}: ErrorViewProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="size-5 text-destructive" aria-hidden="true" />
            </div>
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {onRetry && (
          <CardContent>
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="size-4 mr-2" aria-hidden="true" />
              Reintentar
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
