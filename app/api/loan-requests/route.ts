import { NextRequest, NextResponse } from "next/server";
import { createLoanRequest } from "@/lib/data";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { toolId?: string; requester?: string; dates?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const toolId = body.toolId?.trim();
  const requester = body.requester?.trim();
  if (!toolId || !requester) {
    return NextResponse.json({ error: "toolId et requester sont requis" }, { status: 400 });
  }
  const { ok, demo } = await createLoanRequest({
    toolId,
    requester,
    dates: body.dates?.trim(),
    message: body.message?.trim(),
  });
  return NextResponse.json({ ok, demo }, { status: 201 });
}
