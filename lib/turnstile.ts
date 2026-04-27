import "server-only";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
  action?: string;
}

export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string | null,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isTurnstileEnabled()) {
    return { ok: true };
  }
  if (!token) {
    return { ok: false, reason: "Falta el captcha. Recargá la página." };
  }

  const formData = new FormData();
  formData.append("secret", process.env.TURNSTILE_SECRET_KEY!);
  formData.append("response", token);
  if (remoteIp) formData.append("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body: formData });
    const data = (await res.json()) as TurnstileVerifyResponse;
    if (!data.success) {
      return {
        ok: false,
        reason: "Captcha inválido. Intentá de nuevo.",
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "No se pudo verificar el captcha." };
  }
}
