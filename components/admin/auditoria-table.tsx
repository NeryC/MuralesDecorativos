import { formatDate } from "@/lib/formatting";
import type { Auditoria } from "@/lib/types";

const accionLabels: Record<string, string> = {
  aprobar_mural: "Aprobó mural",
  rechazar_mural: "Rechazó mural",
  aprobar_modificacion: "Aprobó modificación",
  rechazar_modificacion: "Rechazó modificación",
  actualizar_estado: "Actualizó estado",
};

interface AuditoriaTableProps {
  registros: Auditoria[];
}

export function AuditoriaTable({ registros }: AuditoriaTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Fecha</th>
            <th className="px-4 py-3 text-left font-medium">Admin</th>
            <th className="px-4 py-3 text-left font-medium">Acción</th>
            <th className="px-4 py-3 text-left font-medium">Entidad</th>
            <th className="px-4 py-3 text-left font-medium">Detalles</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {registros.map((r) => (
            <tr key={r.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                {formatDate(r.created_at)}
              </td>
              <td className="px-4 py-3">{r.usuario_email ?? r.usuario_nombre ?? r.usuario_id ?? "—"}</td>
              <td className="px-4 py-3 font-medium">{accionLabels[r.accion] ?? r.accion}</td>
              <td className="px-4 py-3 text-muted-foreground">
                <span className="font-mono text-xs">{r.entidad_tipo}:{r.entidad_id?.slice(0, 8) ?? "—"}</span>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate">
                {r.comentario
                  ? r.comentario
                  : r.datos_nuevos
                    ? JSON.stringify(r.datos_nuevos)
                    : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
