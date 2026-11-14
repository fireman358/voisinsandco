import { NextRequest, NextResponse } from "next/server";
import { createLoanRequest } from "@/lib/data";
import { clientIp, LIMITS, overLimit, rateLimited } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (rateLimited(clientIp(req), 10)) {
    return NextResponse.json({ error: "Trop de requêtes, réessayez dans une minute" }, { status: 429 });
  }
  let body: { toolId?: string; requester?: string; dates?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const tooLong = overLimit(body, {
    toolId: LIMITS.toolId,
    requester: LIMITS.requester,
    dates: LIMITS.dates,
    message: LIMITS.message,
  });
  if (tooLong) return NextResponse.json({ error: tooLong }, { status: 400 });

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
