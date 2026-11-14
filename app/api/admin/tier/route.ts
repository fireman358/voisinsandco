import { NextRequest, NextResponse } from "next/server";
import { deleteClaimsForBusiness, isAdmin, setBusinessTier } from "@/lib/data";
import type { BusinessTier } from "@/lib/types";

export const runtime = "nodejs";

const TIERS: BusinessTier[] = ["standard", "verified", "visibility", "pro"];

export async function POST(req: NextRequest) {
  if (!isAdmin(req.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
  }
  let body: { id?: string; tier?: string; paidUntil?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const id = body.id?.trim();
  const tier = body.tier as BusinessTier | undefined;
  const paidUntil = body.paidUntil === undefined ? null : body.paidUntil;
  if (!id || !tier || !TIERS.includes(tier)) {
    return NextResponse.json({ error: "id et tier valides requis" }, { status: 400 });
  }
  const ok = await setBusinessTier(id, tier, paidUntil || null);
  if (ok && tier !== "standard") await deleteClaimsForBusiness(id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}
