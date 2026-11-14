import { NextRequest, NextResponse } from "next/server";
import { deleteRow, listTools, parseGeo } from "@/lib/data";

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
