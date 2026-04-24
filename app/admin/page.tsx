import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminFiltersBar } from "@/components/admin/filters-bar";
import { AdminPagination } from "@/components/admin/pagination";
import { MuralRowActions } from "@/components/admin/mural-row-actions";
import { EstadoBadge } from "@/components/estado-badge";
import { EmptyState } from "@/components/empty-state";
import { Map as MapIcon } from "lucide-react";
import {
  getAllMurales,
  countMuralesPendientes,
  countModificacionesPendientes,
} from "@/lib/queries/admin-murales";

export const metadata: Metadata = {
  title: "Panel admin · Murales",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type AdminEstado = "pendiente" | "aprobado" | "rechazado" | "modificado_pendiente" | "todos";

interface AdminPageProps {
  searchParams: Promise<{
    page?: string;
    estado?: string;
    q?: string;
  }>;
}

const VALID_ESTADOS: AdminEstado[] = ["pendiente", "aprobado", "rechazado", "modificado_pendiente", "todos"];

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const estadoCandidate = params.estado as AdminEstado | undefined;
  const estado: AdminEstado = estadoCandidate && VALID_ESTADOS.includes(estadoCandidate)
    ? estadoCandidate
    : "pendiente";

  const [pagedMurales, pendingMurales, pendingMods] = await Promise.all([
    getAllMurales({ page, estado, q: params.q }),
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
            <h1 className="text-2xl font-semibold">Murales</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gestión de murales registrados.
            </p>
          </div>

          <div className="mb-4">
            <AdminFiltersBar />
          </div>

          {pagedMurales.data.length === 0 ? (
            <EmptyState
              icon={MapIcon}
              title="Sin resultados"
              description="No hay murales que coincidan con los filtros."
            />
          ) : (
            <div className="overflow-x-auto rounded-md border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Nombre</th>
                    <th className="px-4 py-3 text-left font-medium">Candidato</th>
                    <th className="px-4 py-3 text-left font-medium">Ubicación</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-left font-medium">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pagedMurales.data.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{m.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.candidato ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={m.url_maps}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline"
                        >
                          Ver en Maps
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <EstadoBadge estado={m.estado} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatDate(m.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {m.estado === "pendiente" && <MuralRowActions muralId={m.id} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <AdminPagination
            page={pagedMurales.page}
            totalPages={pagedMurales.totalPages}
            total={pagedMurales.total}
            baseSearchParams={{ estado: params.estado, q: params.q }}
            basePath="/admin"
          />
        </main>
      </div>
    </div>
  );
}
