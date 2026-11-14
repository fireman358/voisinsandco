import { NextRequest, NextResponse } from "next/server";
import { createReport } from "@/lib/data";
import { clientIp, LIMITS, overLimit, rateLimited } from "@/lib/security";

export const runtime = "nodejs";

const TYPES = ["need", "event", "tool"] as const;

export async function POST(req: NextRequest) {
  if (rateLimited(clientIp(req), 10)) {
    return NextResponse.json({ error: "Trop de requêtes, réessayez dans une minute" }, { status: 429 });
  }
  let body: { contentType?: string; contentId?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const tooLong = overLimit(body, { reason: LIMITS.reason, contentId: LIMITS.businessId });
  if (tooLong) return NextResponse.json({ error: tooLong }, { status: 400 });

  const contentType = body.contentType as (typeof TYPES)[number] | undefined;
  const contentId = body.contentId?.trim();
  if (!contentType || !TYPES.includes(contentType) || !contentId) {
    return NextResponse.json({ error: "contentType (need|event|tool) et contentId requis" }, { status: 400 });
  }
  const { ok, demo } = await createReport({
    contentType,
    contentId,
    reason: body.reason?.trim() || "",
  });
  return NextResponse.json({ ok, demo }, { status: ok ? 201 : 500 });
}
