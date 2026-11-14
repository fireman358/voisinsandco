import { NextRequest, NextResponse } from "next/server";
import { createTool, deleteRow, listTools, parseGeo } from "@/lib/data";

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
  const ok = await deleteRow("tools", id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}

export async function POST(req: NextRequest) {
  let body: Partial<{ name: string; description: string; owner: string; town: string; lat: number; lng: number }>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const name = body.name?.trim();
  const owner = body.owner?.trim();
  const town = body.town?.trim() || "Quartier";
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!name || !owner || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "name, owner et coordonnées requis" }, { status: 400 });
  }
  const { tool, demo } = await createTool({
    name,
    description: body.description?.trim() ?? "",
    owner,
    town,
    lat,
    lng,
  });
  return NextResponse.json({ tool, demo }, { status: 201 });
}
