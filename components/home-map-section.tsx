import { HomeMapClient } from "@/components/home-map-client";
import { getMuralesAprobados, type EstadoFilter } from "@/lib/queries/murales";

interface HomeMapSectionProps {
  q?: string;
  estado: EstadoFilter;
  highlightId?: string;
}

export async function HomeMapSection({ q, estado, highlightId }: HomeMapSectionProps) {
  const murales = await getMuralesAprobados({ q, estado });
  return <HomeMapClient murales={murales} highlightId={highlightId} />;
}
