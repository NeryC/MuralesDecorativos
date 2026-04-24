import { GitCompare } from "lucide-react";
import { ModificacionCard } from "@/components/admin/modificacion-card";
import { AdminPagination } from "@/components/admin/pagination";
import { EmptyState } from "@/components/empty-state";
import { getModificacionesPendientes } from "@/lib/queries/modificaciones";

interface ModificacionesSectionProps {
  page: number;
}

export async function ModificacionesSection({ page }: ModificacionesSectionProps) {
  const paged = await getModificacionesPendientes(page);

  if (paged.data.length === 0) {
    return (
      <>
        <EmptyState
          icon={GitCompare}
          title="Sin modificaciones pendientes"
          description="Volvé más tarde para revisar nuevas propuestas."
        />
        <AdminPagination
          page={paged.page}
          totalPages={paged.totalPages}
          total={paged.total}
          baseSearchParams={{}}
          basePath="/admin/modificaciones"
        />
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {paged.data.map((m) => (
          <ModificacionCard key={m.id} modificacion={m} />
        ))}
      </div>
      <AdminPagination
        page={paged.page}
        totalPages={paged.totalPages}
        total={paged.total}
        baseSearchParams={{}}
        basePath="/admin/modificaciones"
      />
    </>
  );
}

export function ModificacionesSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 h-64 w-full"
        />
      ))}
    </div>
  );
}
