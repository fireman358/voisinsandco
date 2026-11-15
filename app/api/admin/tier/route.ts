import { NextRequest, NextResponse } from "next/server";
import { deleteClaimsForBusiness, isAdmin, setBusinessPrime, setBusinessTier } from "@/lib/data";
import type { BusinessTier } from "@/lib/types";

export const runtime = "nodejs";

const TIERS: BusinessTier[] = ["standard", "verified", "visibility", "pro"];

export async function POST(req: NextRequest) {
  if (!isAdmin(req.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
  }
  let body: { id?: string; tier?: string; paidUntil?: string | null; prime?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const id = body.id?.trim();
  const tier = body.tier as BusinessTier | undefined;
  const paidUntil = body.paidUntil === undefined ? null : body.paidUntil;
  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }
  if (tier !== undefined && !TIERS.includes(tier)) {
    return NextResponse.json({ error: "tier invalide" }, { status: 400 });
  }
  const wantsTier = tier !== undefined;
  const wantsPrime = typeof body.prime === "boolean";
  if (!wantsTier && !wantsPrime) {
    return NextResponse.json({ error: "tier ou prime requis" }, { status: 400 });
  }
  if (wantsTier && tier) {
    const ok = await setBusinessTier(id, tier, paidUntil || null);
    if (!ok) return NextResponse.json({ error: "base indisponible" }, { status: 503 });
    if (tier !== "standard") await deleteClaimsForBusiness(id);
  }
  if (wantsPrime) {
    const ok = await setBusinessPrime(id, body.prime as boolean);
    if (!ok) return NextResponse.json({ error: "base indisponible" }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
