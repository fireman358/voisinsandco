import { NextRequest, NextResponse } from "next/server";
import { listTools, parseGeo } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = parseGeo(req.nextUrl.searchParams);
  const search = req.nextUrl.searchParams.get("q") ?? "";
  const { items, demo } = await listTools(q, search);
  return NextResponse.json({ items, demo });
}
