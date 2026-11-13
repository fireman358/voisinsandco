import { NextRequest, NextResponse } from "next/server";
import { listDealsAndEvents, parseGeo } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = parseGeo(req.nextUrl.searchParams);
  const { deals, events, demo } = await listDealsAndEvents(q);
  return NextResponse.json({ deals, events, demo });
}
