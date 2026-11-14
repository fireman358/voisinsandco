import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import communes from "@/lib/communes.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Position de départ pour un premier visiteur : la ville détectée par
// Cloudflare (données réseau, sans permission GPS). Repli sur la ville par
// défaut de l'app si rien n'est exploitable.
export async function GET() {
  let lat: number | null = null;
  let lng: number | null = null;
  let city: string | null = null;
  try {
    const { cf } = await getCloudflareContext();
    const cfLat = Number(cf?.latitude);
    const cfLng = Number(cf?.longitude);
    if (Number.isFinite(cfLat) && Number.isFinite(cfLng) && cfLat > 49 && cfLat < 51 && cfLng > 2.5 && cfLng < 6.6) {
      lat = cfLat;
      lng = cfLng;
      city = (cf?.city as string | undefined) ?? null;
    }
  } catch {
    // contexte Cloudflare indisponible (build local) — repli ci-dessous
  }
  let cityName: string | null = city;
  if (cityName && !communes.some((c) => c.name.toLowerCase() === cityName.toLowerCase())) {
    cityName = null;
  }
  if ((lat === null || lng === null) && cityName) {
    const q = cityName.toLowerCase();
    const match =
      communes.find((c) => c.name.toLowerCase() === q) ??
      communes.find((c) => c.name.toLowerCase().startsWith(q)) ??
      null;
    if (match) {
      lat = match.lat;
      lng = match.lng;
      cityName = match.name;
    }
  }
  if (lat === null || lng === null || !cityName) {
    return NextResponse.json({ city: null });
  }
  return NextResponse.json({ city: cityName, lat, lng });
}
