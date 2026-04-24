import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MuralModificacion, Mural } from "@/lib/types";
import type { PagedResult } from "./admin-murales";

export interface ModificacionConMural extends MuralModificacion {
  mural: Mural;
}

const DEFAULT_PAGE_SIZE = 20;

export async function getModificacionesPendientes(
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<PagedResult<ModificacionConMural>> {
  const supabase = await createClient();
  const p = Math.max(1, page);
  const size = Math.max(1, Math.min(100, pageSize));
  const from = (p - 1) * size;
  const to = from + size - 1;

  const { data, count, error } = await supabase
    .from("mural_modificaciones")
    .select(`*, mural:murales(*)`, { count: "exact" })
    .eq("estado_solicitud", "pendiente")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[getModificacionesPendientes]", error);
    return { data: [], total: 0, page: p, pageSize: size, totalPages: 0 };
  }

  const total = count ?? 0;
  return {
    data: (data ?? []) as ModificacionConMural[],
    total,
    page: p,
    pageSize: size,
    totalPages: Math.ceil(total / size),
  };
}
