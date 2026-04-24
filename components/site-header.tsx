import type { ReactNode } from "react";
import Link from "next/link";
import { MapPinned, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SiteHeaderProps {
  leading?: ReactNode;
  showAddButton?: boolean;
}

export function SiteHeader({ leading, showAddButton = true }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-primary text-primary-foreground">
      <div className="mx-auto flex h-14 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex items-center gap-2 min-w-0">
          {leading}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold min-w-0"
            aria-label="Ir al inicio"
          >
            <MapPinned className="size-5 shrink-0" aria-hidden="true" />
            <span className="text-sm md:text-base truncate">Murales Políticos</span>
            <span className="hidden md:inline text-xs font-normal text-primary-foreground/70">
              · Paraguay
            </span>
          </Link>
        </div>

        {showAddButton && (
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
              <Link href="/nuevo">
                <Plus className="size-4" aria-hidden="true" />
                Agregar mural
              </Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
