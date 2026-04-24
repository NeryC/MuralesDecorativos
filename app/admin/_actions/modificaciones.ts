"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/lib/auditoria";
import { MESSAGES } from "@/lib/messages";
import type { ActionResult } from "./murales";

async function requireAdminClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return supabase;
}

export async function aprobarModificacionAction(
  muralId: string,
  modificacionId: string,
): Promise<ActionResult> {
  const supabase = await requireAdminClient();
  if (!supabase) return { success: false, error: "No autenticado" };

  const { data: mod, error: modError } = await supabase
    .from("mural_modificaciones")
    .select("*")
    .eq("id", modificacionId)
    .eq("mural_id", muralId)
    .single();

  if (modError || !mod) {
    return { success: false, error: "Modificación no encontrada" };
  }

  // Update mural FIRST: if this fails we leave the modificacion untouched (recoverable).
  // If we updated the modificacion first and the mural update failed, the state would be
  // inconsistent (modificacion "aprobada" but mural still has the old image).
  const { error: updateMuralError } = await supabase
    .from("murales")
    .update({
      estado: "modificado_aprobado",
      imagen_url: mod.nueva_imagen_url,
      imagen_thumbnail_url: mod.nueva_imagen_thumbnail_url,
    })
    .eq("id", muralId);

  if (updateMuralError) {
    console.error("[aprobarModificacionAction] update mural:", updateMuralError);
    return { success: false, error: MESSAGES.ERROR.PROCESAR_MODIFICACION };
  }

  const { error: updateModError } = await supabase
    .from("mural_modificaciones")
    .update({ estado_solicitud: "aprobada" })
    .eq("id", modificacionId);

  if (updateModError) {
    console.error("[aprobarModificacionAction] update mod:", updateModError);
    return { success: false, error: MESSAGES.ERROR.PROCESAR_MODIFICACION };
  }

  await registrarAuditoria({
    accion: "aprobar_modificacion",
    entidadTipo: "modificacion",
    entidadId: modificacionId,
    datosNuevos: {
      estado_solicitud: "aprobada",
      mural_id: muralId,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/modificaciones");
  revalidatePath("/");
  return { success: true };
}

export async function rechazarModificacionAction(
  muralId: string,
  modificacionId: string,
  motivo: string,
): Promise<ActionResult> {
  const supabase = await requireAdminClient();
  if (!supabase) return { success: false, error: "No autenticado" };

  const { error } = await supabase
    .from("mural_modificaciones")
    .update({ estado_solicitud: "rechazada" })
    .eq("id", modificacionId)
    .eq("mural_id", muralId);

  if (error) {
    console.error("[rechazarModificacionAction]", error);
    return { success: false, error: MESSAGES.ERROR.PROCESAR_MODIFICACION };
  }

  await registrarAuditoria({
    accion: "rechazar_modificacion",
    entidadTipo: "modificacion",
    entidadId: modificacionId,
    comentario: motivo?.trim() || undefined,
    datosNuevos: {
      estado_solicitud: "rechazada",
      mural_id: muralId,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/modificaciones");
  revalidatePath("/");
  return { success: true };
}
