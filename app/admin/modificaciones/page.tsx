import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import {
  ModificacionesSection,
  ModificacionesSkeleton,
} from "@/components/admin/modificaciones-section";
import {
  countMuralesPendientes,
  countModificacionesPendientes,
} from "@/lib/queries/admin-murales";

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

  const [pendingMurales, pendingMods] = await Promise.all([
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

          <Suspense key={`mods-${page}`} fallback={<ModificacionesSkeleton />}>
            <ModificacionesSection page={page} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
