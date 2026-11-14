import { NextRequest, NextResponse } from "next/server";
import { isAdmin, listClaims } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdmin(req.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
  }
  return NextResponse.json({ claims: await listClaims() });
}
