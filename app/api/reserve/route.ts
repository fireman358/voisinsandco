import { NextRequest, NextResponse } from "next/server";
import { createReservation } from "@/lib/data";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { dealId?: string; name?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const dealId = body.dealId?.trim();
  const name = body.name?.trim();
  if (!dealId || !name) {
    return NextResponse.json({ error: "dealId et name sont requis" }, { status: 400 });
  }
  const { code, demo } = await createReservation({ dealId, name, phone: body.phone?.trim() });
  return NextResponse.json({ code, demo }, { status: 201 });
}
