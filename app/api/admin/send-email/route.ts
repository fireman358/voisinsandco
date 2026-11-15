import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/data";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isAdmin(req.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
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
  const res = await sendEmail({ to, subject, text });
  if (res.ok) return NextResponse.json({ ok: true });
  if (res.reason === "no_key") {
    return NextResponse.json(
      { error: "RESEND_API_KEY non configuré (wrangler secret put RESEND_API_KEY)" },
      { status: 503 },
    );
  }
  return NextResponse.json({ error: `Resend : HTTP ${res.status}` }, { status: 502 });
}
