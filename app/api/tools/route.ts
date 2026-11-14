import { NextRequest, NextResponse } from "next/server";
import { createTool, deleteRow, listTools, parseGeo } from "@/lib/data";
import { clientIp, LIMITS, overLimit, rateLimited } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = parseGeo(req.nextUrl.searchParams);
  const search = req.nextUrl.searchParams.get("q") ?? "";
  const { items, demo } = await listTools(q, search);
  return NextResponse.json({ items, demo });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const token = req.headers.get("x-owner-token");
  const result = await deleteRow("tools", id, token);
  if (result === "forbidden") {
    return NextResponse.json({ error: "Non autorisé à supprimer cet objet" }, { status: 403 });
  }
  if (result === "unavailable") {
    return NextResponse.json({ error: "base indisponible" }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  if (rateLimited(clientIp(req), 10)) {
    return NextResponse.json({ error: "Trop de requêtes, réessayez dans une minute" }, { status: 429 });
  }
  let body: Partial<{ name: string; description: string; owner: string; town: string; lat: number; lng: number }>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const tooLong = overLimit(body, {
    name: LIMITS.name,
    description: LIMITS.description,
    owner: LIMITS.owner,
    town: LIMITS.town,
  });
  if (tooLong) return NextResponse.json({ error: tooLong }, { status: 400 });

  const name = body.name?.trim();
  const owner = body.owner?.trim();
  const town = body.town?.trim() || "Quartier";
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!name || !owner || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "name, owner et coordonnées requis" }, { status: 400 });
  }
  const { tool, ownerToken, demo } = await createTool({
    name,
    description: body.description?.trim() ?? "",
    owner,
    town,
    lat,
    lng,
  });
  return NextResponse.json({ tool, ownerToken, demo }, { status: 201 });
}
