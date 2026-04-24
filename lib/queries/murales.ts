import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MuralWithModificaciones } from "@/lib/types";

export type EstadoFilter = "todos" | "aprobado" | "modificado";

export interface MuralesFilters {
  q?: string;
  estado?: EstadoFilter;
}

export async function getMuralesAprobados(
  filters: MuralesFilters = {},
): Promise<MuralWithModificaciones[]> {
  const supabase = await createClient();

  let query = supabase
    .from("murales")
    .select(`
      *,
      mural_modificaciones (*)
    `)
    .order("created_at", { ascending: false });

  if (filters.estado === "aprobado") {
    query = query.eq("estado", "aprobado");
  } else if (filters.estado === "modificado") {
    query = query.in("estado", ["modificado_aprobado", "modificado_pendiente"]);
  } else {
    query = query.in("estado", [
      "aprobado",
      "modificado_aprobado",
      "modificado_pendiente",
    ]);
  }

  if (filters.q && filters.q.trim()) {
    const safe = filters.q.trim().replace(/[,()*"\\]/g, " ").slice(0, 100);
    if (safe.trim()) {
      const term = `%${safe}%`;
      query = query.or(
        `nombre.ilike.${term},candidato.ilike.${term},comentario.ilike.${term}`,
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getMuralesAprobados]", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  return (data ?? []) as MuralWithModificaciones[];
}

export async function getMuralById(
  id: string,
): Promise<MuralWithModificaciones | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("murales")
    .select(`*, mural_modificaciones (*)`)
    .eq("id", id)
    .single();

  if (error) {
    console.error("[getMuralById]", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }

  return data as MuralWithModificaciones;
}

export interface MuralesStats {
  total: number;
  aprobados: number;
  pendientes: number;
  modificados: number;
}

export async function getMuralesStats(): Promise<MuralesStats> {
  const supabase = await createClient();

  const [totalRes, aprobadosRes, pendientesRes, modificadosRes] =
    await Promise.all([
      supabase.from("murales").select("id", { count: "exact", head: true }),
      supabase
        .from("murales")
        .select("id", { count: "exact", head: true })
        .eq("estado", "aprobado"),
      supabase
        .from("murales")
        .select("id", { count: "exact", head: true })
        .eq("estado", "pendiente"),
      supabase
        .from("murales")
        .select("id", { count: "exact", head: true })
        .in("estado", ["modificado_aprobado", "modificado_pendiente"]),
    ]);

  return {
    total: totalRes.count ?? 0,
    aprobados: aprobadosRes.count ?? 0,
    pendientes: pendientesRes.count ?? 0,
    modificados: modificadosRes.count ?? 0,
  };
}
