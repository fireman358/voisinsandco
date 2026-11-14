import { NextRequest, NextResponse } from "next/server";
import { createClaim } from "@/lib/data";
import { clientIp, LIMITS, overLimit, rateLimited } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (rateLimited(clientIp(req), 5)) {
    return NextResponse.json({ error: "Trop de requêtes, réessayez dans une minute" }, { status: 429 });
  }
  let body: { businessId?: string; name?: string; email?: string; phone?: string; bce?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const tooLong = overLimit(body, {
    name: LIMITS.name,
    email: LIMITS.email,
    phone: LIMITS.phone,
    bce: LIMITS.bce,
    message: LIMITS.message,
    businessId: LIMITS.businessId,
  });
  if (tooLong) return NextResponse.json({ error: tooLong }, { status: 400 });

  const businessId = body.businessId?.trim();
  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim();
  if (!businessId || !name || !email || !email.includes("@")) {
    return NextResponse.json({ error: "businessId, name et un e-mail valide sont requis" }, { status: 400 });
  }
  const { ok, demo } = await createClaim({
    businessId,
    name,
    email,
    phone: phone || undefined,
    bce: body.bce?.trim() || undefined,
    message: body.message?.trim(),
  });
  return NextResponse.json({ ok, demo }, { status: ok ? 200 : 500 });
}
