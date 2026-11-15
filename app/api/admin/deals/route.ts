import { NextRequest, NextResponse } from "next/server";
import { createDeal, deleteDeal, isAdmin, listAllDeals } from "@/lib/data";
import type { BusinessCategory } from "@/lib/types";

export const runtime = "nodejs";

const CATEGORIES: BusinessCategory[] = ["alimentation", "artisan", "horeca", "distributeur"];

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
  }
  return NextResponse.json({ deals: await listAllDeals() });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
  }
  let body: {
    businessId?: string;
    businessName?: string;
    category?: string;
    title?: string;
    description?: string;
    price?: number;
    originalPrice?: number;
    quantity?: number;
    remaining?: number;
    pickup?: string;
    town?: string;
    lat?: number;
    lng?: number;
    expiresAt?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const title = body.title?.trim();
  const businessName = body.businessName?.trim();
  const category = body.category as BusinessCategory | undefined;
  const price = num(body.price);
  const town = body.town?.trim();
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const expiresAt = body.expiresAt?.trim();
  if (
    !title ||
    !businessName ||
    !category ||
    !CATEGORIES.includes(category) ||
    price === null ||
    !town ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    !expiresAt
  ) {
    return NextResponse.json(
      { error: "title, businessName, category, price, town, coordonnées et expiresAt sont requis" },
      { status: 400 },
    );
  }
  const quantity = Math.max(1, Math.round(num(body.quantity) ?? 1));
  const remaining = Math.min(quantity, Math.round(num(body.remaining) ?? quantity));
  const originalPrice = num(body.originalPrice);
  const { deal, demo } = await createDeal({
    businessId: body.businessId?.trim() || "admin",
    businessName,
    category,
    title,
    description: body.description?.trim() ?? "",
    price,
    originalPrice: originalPrice && originalPrice > 0 ? originalPrice : undefined,
    quantity,
    remaining,
    pickup: body.pickup?.trim() ?? "",
    town,
    lat,
    lng,
    expiresAt,
  });
  return NextResponse.json({ deal, demo }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const ok = await deleteDeal(id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}
