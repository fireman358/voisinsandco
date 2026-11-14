import { NextRequest, NextResponse } from "next/server";
import { createReservation } from "@/lib/data";
import { clientIp, LIMITS, overLimit, rateLimited } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (rateLimited(clientIp(req), 10)) {
    return NextResponse.json({ error: "Trop de requêtes, réessayez dans une minute" }, { status: 429 });
  }
  let body: { dealId?: string; name?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const tooLong = overLimit(body, {
    dealId: LIMITS.dealId,
    name: LIMITS.name,
    phone: LIMITS.phone,
  });
  if (tooLong) return NextResponse.json({ error: tooLong }, { status: 400 });

  const dealId = body.dealId?.trim();
  const name = body.name?.trim();
  if (!dealId || !name) {
    return NextResponse.json({ error: "dealId et name sont requis" }, { status: 400 });
  }
  const result = await createReservation({ dealId, name, phone: body.phone?.trim() });
  if ("error" in result) {
    return NextResponse.json({ error: "Ce panier vient d'être épuisé" }, { status: 409 });
  }
  return NextResponse.json({ code: result.code, demo: result.demo }, { status: 201 });
}
