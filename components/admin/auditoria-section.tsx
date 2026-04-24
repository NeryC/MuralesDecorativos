import { ClipboardList } from "lucide-react";
import { AuditoriaTable } from "@/components/admin/auditoria-table";
import { AdminPagination } from "@/components/admin/pagination";
import { EmptyState } from "@/components/empty-state";
import { getAuditoria } from "@/lib/queries/auditoria";
import type { AccionAuditoria } from "@/lib/types";

interface AuditoriaSectionProps {
  page: number;
  accion?: AccionAuditoria;
  rawAccionParam?: string;
}

export async function AuditoriaSection({ page, accion, rawAccionParam }: AuditoriaSectionProps) {
  const paged = await getAuditoria({ page, accion });

  if (paged.data.length === 0) {
    return (
      <>
        <EmptyState
          icon={ClipboardList}
          title="Sin registros"
          description="Todavía no hay acciones registradas."
        />
        <AdminPagination
          page={paged.page}
          totalPages={paged.totalPages}
          total={paged.total}
          baseSearchParams={{ accion: rawAccionParam }}
          basePath="/admin/auditoria"
        />
      </>
    );
  }

  return (
    <>
      <AuditoriaTable registros={paged.data} />
      <AdminPagination
        page={paged.page}
        totalPages={paged.totalPages}
        total={paged.total}
        baseSearchParams={{ accion: rawAccionParam }}
        basePath="/admin/auditoria"
      />
    </>
  );
}

export function AuditoriaSkeleton() {
  return (
    <div className="space-y-2">
      <div className="animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 h-10 w-full" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 h-12 w-full"
        />
      ))}
    </div>
  );
}
