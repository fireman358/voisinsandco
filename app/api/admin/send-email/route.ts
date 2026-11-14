import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isAdmin } from "@/lib/data";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isAdmin(req.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
  }
  let apiKey: string | undefined;
  let from: string | undefined;
  try {
    const { env } = getCloudflareContext();
    apiKey = env.RESEND_API_KEY;
    from = env.RESEND_FROM;
  } catch {
    apiKey = undefined;
  }
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY non configuré (wrangler secret put RESEND_API_KEY)" },
      { status: 503 },
    );
  }
  let body: { to?: string; subject?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const to = body.to?.trim();
  const subject = body.subject?.trim();
  const text = body.text?.trim();
  if (!to || !to.includes("@") || !subject || !text) {
    return NextResponse.json({ error: "to, subject et text requis" }, { status: 400 });
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from ?? "Voisins & Co <onboarding@resend.dev>",
      to: [to],
      subject,
      text,
    }),
  });
  if (!res.ok) {
    return NextResponse.json({ error: `Resend : HTTP ${res.status}` }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
