import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { findTownBySlug, listBusinessesByTown } from "@/lib/data";
import { GROUP_LABELS, activityLabel, groupOf, type Business, type GroupKey } from "@/lib/types";

export const revalidate = 3600;

const BASE = "https://lebonvoisin.org";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const town = await findTownBySlug(slug);
  if (!town) return { title: "Commune introuvable — Le Bon Voisin" };
  return {
    title: `Commerces et artisans à ${town} — Le Bon Voisin`,
    description: `Annuaire des commerces, artisans et services à ${town} : adresses, téléphones, horaires et bons plans de proximité.`,
    alternates: { canonical: `/commune/${slug}` },
  };
}

function activityOf(b: Business): string {
  return activityLabel(b.subcategory) || GROUP_LABELS[groupOf(b.subcategory, b.category)];
}

export default async function CommunePage({ params }: Props) {
  const { slug } = await params;
  const town = await findTownBySlug(slug);
  if (!town) notFound();

  const { items, total } = await listBusinessesByTown(town, 300);

  const byGroup = new Map<GroupKey, Business[]>();
  for (const b of items) {
    const g = groupOf(b.subcategory, b.category);
    const arr = byGroup.get(g) ?? [];
    arr.push(b);
    byGroup.set(g, arr);
  }
  const groups = [...byGroup.entries()].sort((a, b) => b[1].length - a[1].length);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Commerces et artisans à ${town}`,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 20).map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      url: `${BASE}/commerce/${encodeURIComponent(b.id)}`,
    })),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: town, item: `${BASE}/commune/${slug}` },
    ],
  };

  return (
    <div className="min-h-dvh bg-paper px-4 py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Link href="/" className="flex items-center gap-1 text-sm font-medium text-forest">
          <ArrowLeft className="size-4" /> Le Bon Voisin
        </Link>

        <header className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Annuaire local</p>
          <h1 className="text-2xl font-extrabold text-neutral-900">Commerces et artisans à {town}</h1>
          <p className="text-sm text-neutral-600">
            {total} commerce{total > 1 ? "s" : ""}, artisan{total > 1 ? "s" : ""} et service{total > 1 ? "s" : ""}{" "}
            référencé{total > 1 ? "s" : ""} à {town}.
            {total > items.length ? ` Affichage des ${items.length} premiers.` : ""}
          </p>
        </header>

        {groups.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucune fiche pour cette commune.</p>
        ) : (
          groups.map(([g, list]) => (
            <section key={g} className="space-y-2">
              <h2 className="text-sm font-bold text-neutral-900">
                {GROUP_LABELS[g]} <span className="font-normal text-neutral-400">({list.length})</span>
              </h2>
              <ul className="space-y-1.5">
                {list.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/commerce/${encodeURIComponent(b.id)}`}
                      className="block rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm transition-colors hover:border-forest/40"
                    >
                      <span className="block truncate font-semibold text-neutral-800">{b.name}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                        {activityOf(b)} · <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{b.address}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        <p className="pt-2 text-xs text-neutral-400">
          <Link href="/" className="text-forest underline-offset-2 hover:underline">
            Retour à Le Bon Voisin
          </Link>
        </p>
      </div>
    </div>
  );
}
