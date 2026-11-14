import { NextRequest, NextResponse } from "next/server";
import { createEvent, deleteRow } from "@/lib/data";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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
  const { event, demo } = await createEvent({
    title,
    organizer,
    type: body.type?.trim() || "Asso",
    date,
    location: body.location?.trim() || town,
    town,
    lat,
    lng,
  });
  return NextResponse.json({ event, demo }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const ok = await deleteRow("events", id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}
