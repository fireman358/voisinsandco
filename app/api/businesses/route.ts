import { NextRequest, NextResponse } from "next/server";
import { createBusiness, listBusinesses, parseGeo } from "@/lib/data";
import { clientIp, LIMITS, overLimit, rateLimited } from "@/lib/security";
import type { BusinessCategory } from "@/lib/types";

export const runtime = "nodejs";

const CATEGORIES: BusinessCategory[] = ["alimentation", "artisan", "horeca", "distributeur"];

export async function GET(req: NextRequest) {
  const q = parseGeo(req.nextUrl.searchParams);
  const category = req.nextUrl.searchParams.get("category") ?? "all";
  const search = req.nextUrl.searchParams.get("q") ?? undefined;
  const activity = req.nextUrl.searchParams.get("activity") ?? undefined;
  const { items, demo, total, facets } = await listBusinesses(q, category, search, activity);
  return NextResponse.json({ items, demo, total, facets });
}

export async function POST(req: NextRequest) {
  if (rateLimited(clientIp(req), 5)) {
    return NextResponse.json({ error: "Trop de requêtes, réessayez dans une minute" }, { status: 429 });
  }
  let body: {
    name?: string;
    category?: string;
    subcategory?: string;
    address?: string;
    town?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
    phone?: string;
    website?: string;
    hours?: string;
    bce?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const tooLong = overLimit(body, {
    name: LIMITS.name,
    address: LIMITS.name,
    town: LIMITS.town,
    postalCode: LIMITS.bce,
    phone: LIMITS.phone,
    website: LIMITS.website,
    hours: LIMITS.hours,
    bce: LIMITS.bce,
    contactName: LIMITS.name,
    contactEmail: LIMITS.email,
    contactPhone: LIMITS.phone,
  });
  if (tooLong) return NextResponse.json({ error: tooLong }, { status: 400 });

  const name = body.name?.trim();
  const category = body.category as BusinessCategory | undefined;
  const address = body.address?.trim();
  const town = body.town?.trim();
  const postalCode = body.postalCode?.trim() ?? "";
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const contactName = body.contactName?.trim();
  const contactEmail = body.contactEmail?.trim();
  if (
    !name ||
    !category ||
    !CATEGORIES.includes(category) ||
    !address ||
    !town ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    !contactName ||
    !contactEmail ||
    !contactEmail.includes("@")
  ) {
    return NextResponse.json(
      { error: "name, category, address, town, coordonnées, contactName et contactEmail (valide) sont requis" },
      { status: 400 },
    );
  }

  const { business, demo, existing } = await createBusiness({
    name,
    category,
    subcategory: body.subcategory?.trim() || undefined,
    address,
    town,
    postalCode,
    lat,
    lng,
    phone: body.phone?.trim() || undefined,
    website: body.website?.trim() || undefined,
    hours: body.hours?.trim() || undefined,
    bce: body.bce?.trim() || undefined,
    contactName,
    contactEmail,
    contactPhone: body.contactPhone?.trim() || undefined,
  });
  if (existing) {
    return NextResponse.json(
      {
        error: `Une fiche « ${business.name} » existe déjà à ${business.town} — utilise le bouton « Revendiquer » sur sa fiche plutôt que d'en créer une nouvelle.`,
        business,
      },
      { status: 409 },
    );
  }
  return NextResponse.json({ business, demo }, { status: 201 });
}
