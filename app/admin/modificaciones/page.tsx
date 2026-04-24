import type { Metadata } from "next";
import { GitCompare } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ModificacionCard } from "@/components/admin/modificacion-card";
import { AdminPagination } from "@/components/admin/pagination";
import { EmptyState } from "@/components/empty-state";
import { getModificacionesPendientes } from "@/lib/queries/modificaciones";
import { countMuralesPendientes, countModificacionesPendientes } from "@/lib/queries/admin-murales";

export const metadata: Metadata = {
  title: "Modificaciones pendientes · Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ModificacionesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const [paged, pendingMurales, pendingMods] = await Promise.all([
    getModificacionesPendientes(page),
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
            <h1 className="text-2xl font-semibold">Modificaciones pendientes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Aprobá o rechazá las propuestas de cambio en murales existentes.
            </p>
          </div>

          {paged.data.length === 0 ? (
            <EmptyState
              icon={GitCompare}
              title="Sin modificaciones pendientes"
              description="Volvé más tarde para revisar nuevas propuestas."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {paged.data.map((m) => (
                <ModificacionCard key={m.id} modificacion={m} />
              ))}
            </div>
          )}

          <AdminPagination
            page={paged.page}
            totalPages={paged.totalPages}
            total={paged.total}
            baseSearchParams={{}}
            basePath="/admin/modificaciones"
          />
        </main>
      </div>
    </div>
  );
}
