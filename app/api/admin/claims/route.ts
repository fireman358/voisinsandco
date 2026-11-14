import { NextRequest, NextResponse } from "next/server";
import { isAdmin, listClaims, deleteClaim } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdmin(req.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
  }
  return NextResponse.json({ claims: await listClaims() });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
  }
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const ok = await deleteClaim(body.id);
  if (!ok) return NextResponse.json({ error: "base indisponible" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
