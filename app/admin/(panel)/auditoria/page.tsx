import type { Metadata } from "next";
import { Suspense } from "react";
import {
  AuditoriaSection,
  AuditoriaSkeleton,
} from "@/components/admin/auditoria-section";
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

  const suspenseKey = `aud-${page}-${accion ?? ""}`;

  return (
    <>
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
    </>
  );
}
