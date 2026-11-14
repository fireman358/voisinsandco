import { NextRequest, NextResponse } from "next/server";
import { isAdmin, setContentHidden } from "@/lib/data";

export const runtime = "nodejs";

const TABLES = ["needs", "tools", "events"] as const;

export async function POST(req: NextRequest) {
  if (!isAdmin(req.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "non autorisé" }, { status: 403 });
  }
  let body: { table?: string; id?: string; hidden?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const table = body.table as (typeof TABLES)[number] | undefined;
  const id = body.id?.trim();
  if (!table || !TABLES.includes(table) || !id || typeof body.hidden !== "boolean") {
    return NextResponse.json({ error: "table (needs|tools|events), id et hidden requis" }, { status: 400 });
  }
  const ok = await setContentHidden(table, id, body.hidden);
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}
