import { NextRequest, NextResponse } from "next/server";
import { createNeed, deleteRow, listNeeds, parseGeo, takeNeed, type NewNeed } from "@/lib/data";
import { clientIp, LIMITS, overLimit, rateLimited } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = parseGeo(req.nextUrl.searchParams);
  const { items, demo } = await listNeeds(q);
  return NextResponse.json({ items, demo });
}

export async function POST(req: NextRequest) {
  if (rateLimited(clientIp(req), 10)) {
    return NextResponse.json({ error: "Trop de requêtes, réessayez dans une minute" }, { status: 429 });
  }
  let body: Partial<NewNeed>;
  try {
    body = (await req.json()) as Partial<NewNeed>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const tooLong = overLimit(body, {
    title: LIMITS.title,
    description: LIMITS.description,
    author: LIMITS.author,
    town: LIMITS.town,
    artisanCategory: LIMITS.type,
  });
  if (tooLong) return NextResponse.json({ error: tooLong }, { status: 400 });

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
  const { need, ownerToken, demo } = await createNeed({
    title,
    description,
    kind,
    artisanCategory: kind === "artisan" ? body.artisanCategory : undefined,
    author: body.author?.trim() || "Voisin·e",
    town: body.town?.trim() || "Quartier",
    lat,
    lng,
  });
  return NextResponse.json({ need, ownerToken, demo }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const token = req.headers.get("x-owner-token");
  const result = await deleteRow("needs", id, token);
  if (result === "forbidden") {
    return NextResponse.json({ error: "Non autorisé à supprimer cette publication" }, { status: 403 });
  }
  if (result === "unavailable") {
    return NextResponse.json({ error: "base indisponible" }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const id = body.id?.trim();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const ok = await takeNeed(id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}
