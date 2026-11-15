import { AppShell } from "@/components/app-shell";
import { listBusinesses, parseGeo } from "@/lib/data";
import { DEFAULT_BASE, DEFAULT_RADIUS } from "@/lib/constants";
import type { Business } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function businessesJsonLd(items: Business[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Commerces et artisans de proximité",
    numberOfItems: items.length,
    itemListElement: items.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: b.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: b.address,
          addressLocality: b.town,
          postalCode: b.postalCode,
          addressCountry: "BE",
        },
        ...(b.phone ? { telephone: b.phone } : {}),
        ...(b.website ? { url: b.website } : {}),
        geo: { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lng },
      },
    })),
  });
}

export default async function Home() {
  let items: Business[] = [];
  let total = 0;
  let demo = false;
  try {
    const q = parseGeo(
      new URLSearchParams({
        lat: String(DEFAULT_BASE.lat),
        lng: String(DEFAULT_BASE.lng),
        radius: String(DEFAULT_RADIUS),
      }),
    );
    const res = await listBusinesses(q, "all");
    items = res.items;
    total = res.total;
    demo = res.demo;
  } catch {
    // rendu sans données : le client rechargera au montage
  }

  const jsonLd = items.length > 0 ? businessesJsonLd(items.slice(0, 20)) : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
      <AppShell initialData={{ items, total, demo }} />
    </>
  );
}
