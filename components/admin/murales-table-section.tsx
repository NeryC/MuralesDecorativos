import Link from "next/link";
import { Map as MapIcon } from "lucide-react";
import { formatDate } from "@/lib/formatting";
import { EstadoBadge } from "@/components/estado-badge";
import { EmptyState } from "@/components/empty-state";
import { AdminPagination } from "@/components/admin/pagination";
import { MuralRowActions } from "@/components/admin/mural-row-actions";
import { getAllMurales } from "@/lib/queries/admin-murales";

type AdminEstado = "pendiente" | "aprobado" | "rechazado" | "modificado_pendiente" | "todos";

interface MuralesTableSectionProps {
  page: number;
  estado: AdminEstado;
  q?: string;
  rawEstadoParam?: string;
}

export async function MuralesTableSection({
  page,
  estado,
  q,
  rawEstadoParam,
}: MuralesTableSectionProps) {
  const pagedMurales = await getAllMurales({ page, estado, q });

  if (pagedMurales.data.length === 0) {
    return (
      <>
        <EmptyState
          icon={MapIcon}
          title="Sin resultados"
          description="No hay murales que coincidan con los filtros."
        />
        <AdminPagination
          page={pagedMurales.page}
          totalPages={pagedMurales.totalPages}
          total={pagedMurales.total}
          baseSearchParams={{ estado: rawEstadoParam, q }}
          basePath="/admin"
        />
      </>
    );
  }

  return (
    <>
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

      <AdminPagination
        page={pagedMurales.page}
        totalPages={pagedMurales.totalPages}
        total={pagedMurales.total}
        baseSearchParams={{ estado: rawEstadoParam, q }}
        basePath="/admin"
      />
    </>
  );
}

export function MuralesTableSkeleton() {
  return (
    <div className="space-y-2">
      <div className="animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 h-10 w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 h-14 w-full"
        />
      ))}
    </div>
  );
}
