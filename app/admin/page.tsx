import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminFiltersBar } from "@/components/admin/filters-bar";
import {
  MuralesTableSection,
  MuralesTableSkeleton,
} from "@/components/admin/murales-table-section";
import {
  countMuralesPendientes,
  countModificacionesPendientes,
} from "@/lib/queries/admin-murales";

export const metadata: Metadata = {
  title: "Panel admin · Murales",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type AdminEstado =
  | "pendiente"
  | "aprobado"
  | "rechazado"
  | "modificado_pendiente"
  | "todos";

interface AdminPageProps {
  searchParams: Promise<{
    page?: string;
    estado?: string;
    q?: string;
  }>;
}

const VALID_ESTADOS: AdminEstado[] = [
  "pendiente",
  "aprobado",
  "rechazado",
  "modificado_pendiente",
  "todos",
];

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const estadoCandidate = params.estado as AdminEstado | undefined;
  const estado: AdminEstado =
    estadoCandidate && VALID_ESTADOS.includes(estadoCandidate)
      ? estadoCandidate
      : "pendiente";

  const [pendingMurales, pendingMods] = await Promise.all([
    countMuralesPendientes(),
    countModificacionesPendientes(),
  ]);

  const suspenseKey = `${params.q ?? ""}-${estado}-${page}`;

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
            <h1 className="text-2xl font-semibold">Murales</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gestión de murales registrados.
            </p>
          </div>

          <div className="mb-4">
            <AdminFiltersBar />
          </div>

          <Suspense key={suspenseKey} fallback={<MuralesTableSkeleton />}>
            <MuralesTableSection
              page={page}
              estado={estado}
              q={params.q}
              rawEstadoParam={params.estado}
            />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
