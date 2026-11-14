import { NextRequest, NextResponse } from "next/server";
import { listBusinesses, parseGeo } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = parseGeo(req.nextUrl.searchParams);
  const category = req.nextUrl.searchParams.get("category") ?? "all";
  const { items, demo, total } = await listBusinesses(q, category);
  return NextResponse.json({ items, demo, total });
}
