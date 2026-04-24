import { Badge } from "@/components/ui/badge";
import type { EstadoMural } from "@/lib/types";

interface EstadoBadgeProps {
  estado: EstadoMural;
}

const config: Record<
  EstadoMural,
  { label: string; className: string }
> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-warning/10 text-warning border-warning/30",
  },
  aprobado: {
    label: "Aprobado",
    className: "bg-success/10 text-success border-success/30",
  },
  rechazado: {
    label: "Rechazado",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  modificado_pendiente: {
    label: "Modif. pendiente",
    className: "bg-warning/10 text-warning border-warning/30",
  },
  modificado_aprobado: {
    label: "Modificado",
    className: "bg-accent/10 text-accent border-accent/30",
  },
};

export function EstadoBadge({ estado }: EstadoBadgeProps) {
  const cfg = config[estado];
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}
