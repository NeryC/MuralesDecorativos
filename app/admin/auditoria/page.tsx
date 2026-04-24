import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import {
  AuditoriaSection,
  AuditoriaSkeleton,
} from "@/components/admin/auditoria-section";
import {
  countMuralesPendientes,
  countModificacionesPendientes,
} from "@/lib/queries/admin-murales";
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

  const accion =
    params.accion && VALID_ACCIONES.includes(params.accion as AccionAuditoria)
      ? (params.accion as AccionAuditoria)
      : undefined;

  const [pendingMurales, pendingMods] = await Promise.all([
    countMuralesPendientes(),
    countModificacionesPendientes(),
  ]);

  const suspenseKey = `aud-${page}-${accion ?? ""}`;

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

          <Suspense key={suspenseKey} fallback={<AuditoriaSkeleton />}>
            <AuditoriaSection
              page={page}
              accion={accion}
              rawAccionParam={params.accion}
            />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
