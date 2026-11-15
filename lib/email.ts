import { getCloudflareContext } from "@opennextjs/cloudflare";

export type EmailResult =
  | { ok: true }
  | { ok: false; reason: "no_key" }
  | { ok: false; reason: "http"; status: number };

/** Envoie un e-mail via Resend. Renvoie « no_key » si RESEND_API_KEY manque. */
export async function sendEmail(input: { to: string; subject: string; text: string }): Promise<EmailResult> {
  let apiKey: string | undefined;
  let from: string | undefined;
  try {
    const { env } = getCloudflareContext();
    apiKey = env.RESEND_API_KEY;
    from = env.RESEND_FROM;
  } catch {
    apiKey = undefined;
  }
  if (!apiKey) return { ok: false, reason: "no_key" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from ?? "Le Bon Voisin <onboarding@resend.dev>",
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });
  if (!res.ok) return { ok: false, reason: "http", status: res.status };
  return { ok: true };
}

/** Boîte de réception de l'admin (secret NOTIF_EMAIL). */
export function adminNotifEmail(): string | null {
  try {
    const { env } = getCloudflareContext();
    return env.NOTIF_EMAIL ?? null;
  } catch {
    return null;
  }
}
