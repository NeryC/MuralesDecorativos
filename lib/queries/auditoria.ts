import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Auditoria, AccionAuditoria } from "@/lib/types";
import type { PagedResult } from "./admin-murales";

export interface AuditoriaFilters {
  page?: number;
  pageSize?: number;
  accion?: AccionAuditoria;
  desde?: string;
  hasta?: string;
}

const DEFAULT_PAGE_SIZE = 30;

export async function getAuditoria(
  filters: AuditoriaFilters = {},
): Promise<PagedResult<Auditoria>> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("auditoria")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.accion) query = query.eq("accion", filters.accion);
  if (filters.desde) query = query.gte("created_at", filters.desde);
  if (filters.hasta) query = query.lte("created_at", filters.hasta);

  const { data, count, error } = await query;

  if (error) {
    console.error("[getAuditoria]", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const total = count ?? 0;
  return {
    data: (data ?? []) as Auditoria[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
