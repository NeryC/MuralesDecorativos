import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AuditoriaTable } from "@/components/admin/auditoria-table";
import { AdminPagination } from "@/components/admin/pagination";
import { EmptyState } from "@/components/empty-state";
import { getAuditoria } from "@/lib/queries/auditoria";
import { countMuralesPendientes, countModificacionesPendientes } from "@/lib/queries/admin-murales";
import type { AccionAuditoria } from "@/lib/types";

export const metadata: Metadata = {
  title: "Auditoría · Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const VALID_ACCIONES: AccionAuditoria[] = [
  "aprobar_mural",
  "rechazar_mural",
  "aprobar_modificacion",
  "rechazar_modificacion",
  "actualizar_estado",
];

interface PageProps {
  searchParams: Promise<{ page?: string; accion?: string }>;
}

export default async function AuditoriaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const accion = params.accion && VALID_ACCIONES.includes(params.accion as AccionAuditoria)
    ? (params.accion as AccionAuditoria)
    : undefined;

  const [paged, pendingMurales, pendingMods] = await Promise.all([
    getAuditoria({ page, accion }),
    countMuralesPendientes(),
    countModificacionesPendientes(),
  ]);

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar
        pendingMuralesCount={pendingMurales}
        pendingModificacionesCount={pendingMods}
      />
      <div className="flex-1 flex flex-col">
        <SiteHeader />
        <main id="main" className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Auditoría</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Registro inmutable de las acciones administrativas.
            </p>
          </div>

          {paged.data.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Sin registros"
              description="Todavía no hay acciones registradas."
            />
          ) : (
            <AuditoriaTable registros={paged.data} />
          )}

          <AdminPagination
            page={paged.page}
            totalPages={paged.totalPages}
            total={paged.total}
            baseSearchParams={{ accion: params.accion }}
            basePath="/admin/auditoria"
          />
        </main>
      </div>
    </div>
  );
}
