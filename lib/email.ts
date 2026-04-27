import "server-only";
import { captureException } from "@/lib/observability";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendViaResend(args: SendArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from = process.env.RESEND_FROM || "Murales Políticos <onboarding@resend.dev>";

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: args.to, subject: args.subject, html: args.html, text: args.text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      captureException(new Error(`Resend ${res.status}: ${body.slice(0, 200)}`), {
        route: "lib/email.sendViaResend",
        to: args.to,
      });
      return false;
    }
    return true;
  } catch (err) {
    captureException(err, { route: "lib/email.sendViaResend", to: args.to });
    return false;
  }
}

interface NotifyMuralArgs {
  nombre: string;
  candidato?: string | null;
  comentario?: string | null;
  url_maps: string;
  imagen_url: string;
  adminUrl?: string;
}

export async function notifyNewMuralPending(args: NotifyMuralArgs): Promise<boolean> {
  const to = process.env.NOTIFY_EMAIL;
  if (!to) return false;

  const adminUrl = args.adminUrl || "https://murales-politicos.vercel.app/admin";
  const subject = `Nuevo mural pendiente: ${args.nombre}`;

  const text = [
    "Se cargó un nuevo mural pendiente de aprobación.",
    "",
    `Nombre:     ${args.nombre}`,
    `Candidato:  ${args.candidato ?? "—"}`,
    `Comentario: ${args.comentario ?? "—"}`,
    `Ubicación:  ${args.url_maps}`,
    `Imagen:     ${args.imagen_url}`,
    "",
    `Revisar y aprobar: ${adminUrl}`,
  ].join("\n");

  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
      <h2 style="margin:0 0 16px;font-size:18px">Nuevo mural pendiente de aprobación</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#64748b;width:120px">Nombre</td><td><strong>${esc(args.nombre)}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Candidato</td><td>${esc(args.candidato || "—")}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Comentario</td><td>${esc(args.comentario || "—")}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Ubicación</td><td><a href="${esc(args.url_maps)}">Ver en mapa</a></td></tr>
      </table>
      <p style="margin:16px 0"><img src="${esc(args.imagen_url)}" alt="Foto del mural" style="max-width:100%;height:auto;border-radius:8px;border:1px solid #e2e8f0"/></p>
      <p style="margin:16px 0">
        <a href="${esc(adminUrl)}" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600">Revisar en el panel admin</a>
      </p>
      <p style="margin:24px 0 0;color:#94a3b8;font-size:12px">Notificación automática de Murales Políticos.</p>
    </div>`.trim();

  return sendViaResend({ to, subject, html, text });
}
