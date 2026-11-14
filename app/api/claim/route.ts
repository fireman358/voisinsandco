import { NextRequest, NextResponse } from "next/server";
import { createClaim } from "@/lib/data";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { businessId?: string; name?: string; email?: string; phone?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const businessId = body.businessId?.trim();
  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim();
  if (!businessId || !name || !phone) {
    return NextResponse.json({ error: "businessId, name et phone sont requis" }, { status: 400 });
  }
  const { ok, demo } = await createClaim({
    businessId,
    name,
    phone,
    email: email || undefined,
    message: body.message?.trim(),
  });
  return NextResponse.json({ ok, demo }, { status: 201 });
}
