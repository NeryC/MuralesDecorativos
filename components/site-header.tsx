import Link from "next/link";
import { MapPinned, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-primary text-primary-foreground">
      <div className="mx-auto flex h-14 items-center justify-between gap-3 px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold"
          aria-label="Ir al inicio"
        >
          <MapPinned className="size-5" aria-hidden="true" />
          <span className="text-sm md:text-base">Murales Políticos</span>
          <span className="hidden md:inline text-xs font-normal text-primary-foreground/70">
            · Paraguay
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
            <Link href="/nuevo">
              <Plus className="size-4" aria-hidden="true" />
              Agregar mural
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
