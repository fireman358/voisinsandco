import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Globe, MapPin, Megaphone, Phone } from "lucide-react";
import { getBusinessById } from "@/lib/data";
import { GROUP_LABELS, activityLabel, groupOf, type Business } from "@/lib/types";
import { slugify } from "@/lib/utils";

export const revalidate = 3600;

const BASE = "https://lebonvoisin.org";

interface Props {
  params: Promise<{ id: string }>;
}

function activityOf(b: Business): string {
  return activityLabel(b.subcategory) || GROUP_LABELS[groupOf(b.subcategory, b.category)];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const b = await getBusinessById(id);
  if (!b) return { title: "Fiche introuvable — Le Bon Voisin" };
  const activity = activityOf(b);
  return {
    title: `${b.name} — ${activity} à ${b.town} — Le Bon Voisin`,
    description: `${b.name} : ${activity} à ${b.town}. ${b.address}.${b.phone ? ` Tél. ${b.phone}.` : ""}`,
    alternates: { canonical: `/commerce/${id}` },
  };
}

export default async function BusinessPage({ params }: Props) {
  const { id } = await params;
  const b = await getBusinessById(id);
  if (!b) notFound();

  const activity = activityOf(b);
  const townSlug = slugify(b.town);
  const url = `${BASE}/commerce/${encodeURIComponent(b.id)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: b.name,
    ...(b.description ? { description: b.description } : {}),
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
    url,
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: b.town, item: `${BASE}/commune/${townSlug}` },
      { "@type": "ListItem", position: 3, name: b.name, item: url },
    ],
  };

  const telHref = b.phone ? `tel:${b.phone.replace(/[^+\d]/g, "")}` : null;

  return (
    <div className="min-h-dvh bg-paper px-4 py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Link href="/" className="flex items-center gap-1 text-sm font-medium text-forest">
          <ArrowLeft className="size-4" /> Le Bon Voisin
        </Link>

        <header className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{activity}</p>
          <h1 className="text-2xl font-extrabold text-neutral-900">{b.name}</h1>
          <p className="flex items-center gap-1 text-sm text-neutral-600">
            <MapPin className="size-4 shrink-0 text-forest" />
            {b.address}, {b.postalCode} {b.town}
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {telHref && (
            <a
              href={telHref}
              className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-3 py-2 text-sm font-semibold text-white hover:bg-forest/90"
            >
              <Phone className="size-4" /> {b.phone}
            </a>
          )}
          {b.website && (
            <a
              href={b.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:border-forest/40"
            >
              <Globe className="size-4" /> Site web
            </a>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:border-forest/40"
          >
            <MapPin className="size-4" /> Itinéraire
          </a>
        </div>

        <section className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
          {b.description && <p>{b.description}</p>}
          {b.hours && (
            <p className="flex items-center gap-1.5">
              <Clock className="size-4 text-forest" /> {b.hours}
            </p>
          )}
          {b.news && (
            <p className="flex items-start gap-1.5 rounded-lg bg-accent-light px-2.5 py-1.5 font-medium text-accent-dark">
              <Megaphone className="mt-0.5 size-4 shrink-0" /> {b.news}
            </p>
          )}
          {b.bce && <p className="font-mono text-xs text-neutral-400">N° BCE : {b.bce}</p>}
        </section>

        <p className="text-sm">
          <Link href={`/commune/${townSlug}`} className="text-forest underline-offset-2 hover:underline">
            Voir tous les commerces et artisans de {b.town}
          </Link>
        </p>
      </div>
    </div>
  );
}
