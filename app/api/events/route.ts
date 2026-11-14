import { NextRequest, NextResponse } from "next/server";
import { createEvent, deleteRow } from "@/lib/data";
import { clientIp, LIMITS, overLimit, rateLimited } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (rateLimited(clientIp(req), 10)) {
    return NextResponse.json({ error: "Trop de requêtes, réessayez dans une minute" }, { status: 429 });
  }
  let body: {
    title?: string;
    organizer?: string;
    type?: string;
    date?: string;
    location?: string;
    town?: string;
    lat?: number;
    lng?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const tooLong = overLimit(body, {
    title: LIMITS.title,
    organizer: LIMITS.organizer,
    type: LIMITS.type,
    date: LIMITS.date,
    location: LIMITS.location,
    town: LIMITS.town,
  });
  if (tooLong) return NextResponse.json({ error: tooLong }, { status: 400 });

  const title = body.title?.trim();
  const organizer = body.organizer?.trim();
  const date = body.date?.trim();
  const town = body.town?.trim();
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!title || !organizer || !date || !town || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "title, organizer, date, town et coordonnées sont requis" },
      { status: 400 },
    );
  }
  const { event, ownerToken, demo } = await createEvent({
    title,
    organizer,
    type: body.type?.trim() || "Asso",
    date,
    location: body.location?.trim() || town,
    town,
    lat,
    lng,
  });
  return NextResponse.json({ event, ownerToken, demo }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const token = req.headers.get("x-owner-token");
  const result = await deleteRow("events", id, token);
  if (result === "forbidden") {
    return NextResponse.json({ error: "Non autorisé à supprimer cet événement" }, { status: 403 });
  }
  if (result === "unavailable") {
    return NextResponse.json({ error: "base indisponible" }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
