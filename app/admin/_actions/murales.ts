"use server";

import { revalidatePath } from "next/cache";
import { requireAdminClient } from "@/lib/auth/server";
import { registrarAuditoria } from "@/lib/auditoria";
import { MESSAGES } from "@/lib/messages";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

type EstadoMural = "pendiente" | "aprobado" | "rechazado";

export async function aprobarMuralAction(muralId: string): Promise<ActionResult> {
  const auth = await requireAdminClient();
  if (!auth.ok) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from("murales")
    .update({ estado: "aprobado" })
    .eq("id", muralId);

  if (error) {
    console.error("[aprobarMuralAction]", error);
    return { success: false, error: MESSAGES.ERROR.ACTUALIZAR_ESTADO };
  }

  await registrarAuditoria({
    accion: "aprobar_mural",
    entidadTipo: "mural",
    entidadId: muralId,
    datosNuevos: { estado: "aprobado" },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function rechazarMuralAction(
  muralId: string,
  motivo: string,
): Promise<ActionResult> {
  const auth = await requireAdminClient();
  if (!auth.ok) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from("murales")
    .update({ estado: "rechazado" })
    .eq("id", muralId);

  if (error) {
    console.error("[rechazarMuralAction]", error);
    return { success: false, error: MESSAGES.ERROR.ACTUALIZAR_ESTADO };
  }

  await registrarAuditoria({
    accion: "rechazar_mural",
    entidadTipo: "mural",
    entidadId: muralId,
    comentario: motivo?.trim() || undefined,
    datosNuevos: { estado: "rechazado" },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function actualizarEstadoMuralAction(
  muralId: string,
  estado: EstadoMural,
): Promise<ActionResult> {
  const auth = await requireAdminClient();
  if (!auth.ok) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from("murales")
    .update({ estado })
    .eq("id", muralId);

  if (error) {
    console.error("[actualizarEstadoMuralAction]", error);
    return { success: false, error: MESSAGES.ERROR.ACTUALIZAR_ESTADO };
  }

  await registrarAuditoria({
    accion: "actualizar_estado",
    entidadTipo: "mural",
    entidadId: muralId,
    datosNuevos: { estado },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}
