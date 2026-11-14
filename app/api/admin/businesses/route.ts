import { NextRequest, NextResponse } from "next/server";
import { adminSearchBusinesses, isAdmin, updateBusinessDetails } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdmin(req.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
  }
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ items: [] });
  return NextResponse.json({ items: await adminSearchBusinesses(q) });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
  }
  let body: { id?: string; phone?: string; website?: string; hours?: string; news?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "corps JSON invalide" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const clean = (v: string | undefined) => (v === undefined ? undefined : v.trim() || null);
  const ok = await updateBusinessDetails(body.id, {
    phone: clean(body.phone),
    website: clean(body.website),
    hours: clean(body.hours),
    news: clean(body.news),
  });
  if (!ok) return NextResponse.json({ error: "base indisponible" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
