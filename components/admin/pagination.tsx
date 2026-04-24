import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  baseSearchParams: Record<string, string | undefined>;
  basePath: string;
}

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  if (page > 1) sp.set("page", String(page));
  else sp.delete("page");
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function AdminPagination({
  page,
  totalPages,
  total,
  baseSearchParams,
  basePath,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <p className="text-sm text-muted-foreground tabular-nums">
        Página {page} de {totalPages} · {total} registros
      </p>
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <Link href={buildHref(basePath, baseSearchParams, prevPage)}>
            <ChevronLeft className="size-4" aria-hidden="true" />
            Anterior
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          aria-label="Página siguiente"
        >
          <Link href={buildHref(basePath, baseSearchParams, nextPage)}>
            Siguiente
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
