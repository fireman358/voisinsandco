import { NextRequest, NextResponse } from "next/server";
import { createNeed, listNeeds, parseGeo, type NewNeed } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = parseGeo(req.nextUrl.searchParams);
  const { items, demo } = await listNeeds(q);
  return NextResponse.json({ items, demo });
}

export async function POST(req: NextRequest) {
  let body: Partial<NewNeed>;
  try {
    body = (await req.json()) as Partial<NewNeed>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const title = body.title?.trim();
  const description = body.description?.trim() ?? "";
  const kind = body.kind;
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!title || (kind !== "entraide" && kind !== "artisan") || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "title, kind (entraide|artisan), lat et lng sont requis" },
      { status: 400 },
    );
  }
  const { need, demo } = await createNeed({
    title,
    description,
    kind,
    artisanCategory: kind === "artisan" ? body.artisanCategory : undefined,
    author: body.author?.trim() || "Voisin·e",
    town: body.town?.trim() || "Quartier",
    lat,
    lng,
  });
  return NextResponse.json({ need, demo }, { status: 201 });
}
