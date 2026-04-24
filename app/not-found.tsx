import Link from "next/link";
import { MapPinX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center gap-4">
      <div className="rounded-full bg-muted p-3">
        <MapPinX className="size-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-semibold">Página no encontrada</h1>
      <p className="text-muted-foreground max-w-md">La página que buscás no existe o fue movida.</p>
      <Button asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
