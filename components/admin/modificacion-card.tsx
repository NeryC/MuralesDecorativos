import { formatDate } from "@/lib/formatting";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ModificacionActions } from "./modificacion-actions";
import { ClickableThumbnail } from "./clickable-thumbnail";
import type { ModificacionConMural } from "@/lib/queries/modificaciones";

interface ModificacionCardProps {
  modificacion: ModificacionConMural;
}

export function ModificacionCard({ modificacion: m }: ModificacionCardProps) {
  const motivo = m.nuevo_comentario ?? null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{m.mural.nombre}</CardTitle>
            <CardDescription>
              {m.mural.candidato ?? "Sin candidato"} · {formatDate(m.created_at)}
            </CardDescription>
          </div>
          <ModificacionActions muralId={m.mural_id} modificacionId={m.id} />
        </div>
      </CardHeader>
      <CardContent>
        {motivo && (
          <p className="text-sm mb-3">
            <span className="font-medium">Motivo:</span> {motivo}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <figure>
            <figcaption className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Actual
            </figcaption>
            <ClickableThumbnail
              thumbnailUrl={m.mural.imagen_thumbnail_url}
              fullUrl={m.mural.imagen_url}
              alt={`Imagen actual de ${m.mural.nombre}`}
              className="w-full h-40 rounded-md border"
            />
          </figure>
          <figure>
            <figcaption className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Propuesta
            </figcaption>
            <ClickableThumbnail
              thumbnailUrl={m.nueva_imagen_thumbnail_url}
              fullUrl={m.nueva_imagen_url}
              alt={`Imagen propuesta para ${m.mural.nombre}`}
              className="w-full h-40 rounded-md border"
            />
          </figure>
        </div>
      </CardContent>
    </Card>
  );
}
