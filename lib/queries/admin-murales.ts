import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MuralWithModificaciones } from "@/lib/types";

export interface AdminMuralesFilters {
  page?: number;
  pageSize?: number;
  estado?: "pendiente" | "aprobado" | "rechazado" | "modificado_pendiente" | "todos";
  q?: string;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 20;

export async function getAllMurales(
  filters: AdminMuralesFilters = {},
): Promise<PagedResult<MuralWithModificaciones>> {
  const supabase = await createClient();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("murales")
    .select(`*, mural_modificaciones (*)`, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.estado && filters.estado !== "todos") {
    query = query.eq("estado", filters.estado);
  }

  if (filters.q && filters.q.trim()) {
    const safe = filters.q
      .trim()
      .replace(/[,()*"\\]/g, " ")
      .slice(0, 100);
    if (safe.trim()) {
      const term = `%${safe}%`;
      query = query.or(`nombre.ilike.${term},candidato.ilike.${term}`);
    }
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[getAllMurales]", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const total = count ?? 0;
  return {
    data: (data ?? []) as MuralWithModificaciones[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function countMuralesPendientes(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("murales")
    .select("id", { count: "exact", head: true })
    .eq("estado", "pendiente");
  return count ?? 0;
}

export async function countModificacionesPendientes(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("mural_modificaciones")
    .select("id", { count: "exact", head: true })
    .eq("estado_solicitud", "pendiente");
  return count ?? 0;
}
