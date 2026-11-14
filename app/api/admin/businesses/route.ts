import { NextRequest, NextResponse } from "next/server";
import { adminSearchBusinesses, isAdmin } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdmin(req.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
  }
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ items: [] });
  return NextResponse.json({ items: await adminSearchBusinesses(q) });
}
