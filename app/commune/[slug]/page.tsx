import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { findTownBySlug, listBusinessesByTown } from "@/lib/data";
import { GROUP_LABELS, activityLabel, groupOf, type Business } from "@/lib/types";
import { businessSlug } from "@/lib/utils";

export const revalidate = 3600;

const BASE = "https://lebonvoisin.org";
const PAGE_SIZE = 100;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

function activityOf(b: Business): string {
  return activityLabel(b.subcategory) || GROUP_LABELS[groupOf(b.subcategory, b.category)];
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { page: rawPage } = await searchParams;
  const page = parsePage(rawPage);
  const town = await findTownBySlug(slug);
  if (!town) return { title: "Commune introuvable — Le Bon Voisin" };
  return {
    title: `Commerces et artisans à ${town}${page > 1 ? ` (page ${page})` : ""} — Le Bon Voisin`,
    description: `Annuaire des commerces, artisans et services à ${town} : adresses, téléphones, horaires et bons plans de proximité.`,
    alternates: { canonical: `/commune/${slug}${page > 1 ? `?page=${page}` : ""}` },
  };
}

export default async function CommunePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: rawPage } = await searchParams;
  const page = parsePage(rawPage);

  const town = await findTownBySlug(slug);
  if (!town) notFound();

  const { items, total } = await listBusinessesByTown(town, PAGE_SIZE, (page - 1) * PAGE_SIZE);
  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > maxPage) {
    permanentRedirect(`/commune/${slug}${maxPage > 1 ? `?page=${maxPage}` : ""}`);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Commerces et artisans à ${town}`,
    numberOfItems: total,
    itemListElement: items.slice(0, 20).map((b, i) => ({
      "@type": "ListItem",
      position: (page - 1) * PAGE_SIZE + i + 1,
      name: b.name,
      url: `${BASE}/commerce/${encodeURIComponent(businessSlug(b.name, b.id))}`,
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
            {maxPage > 1 ? ` Page ${page} sur ${maxPage}.` : ""}
          </p>
        </header>

        <ul className="space-y-1.5">
          {items.map((b) => (
            <li key={b.id}>
              <Link
                href={`/commerce/${encodeURIComponent(businessSlug(b.name, b.id))}`}
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

        {items.length === 0 && <p className="text-sm text-neutral-500">Aucune fiche pour cette commune.</p>}

        {maxPage > 1 && (
          <nav className="flex items-center justify-between gap-2 border-t border-neutral-200 pt-3 text-sm">
            {page > 1 ? (
              <Link
                href={`/commune/${slug}${page - 1 > 1 ? `?page=${page - 1}` : ""}`}
                className="font-medium text-forest hover:underline"
              >
                ← Précédent
              </Link>
            ) : (
              <span />
            )}
            <span className="text-xs text-neutral-500">
              Page {page} / {maxPage}
            </span>
            {page < maxPage ? (
              <Link href={`/commune/${slug}?page=${page + 1}`} className="font-medium text-forest hover:underline">
                Suivant →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}

        <p className="pt-2 text-xs text-neutral-400">
          <Link href="/communes" className="text-forest underline-offset-2 hover:underline">
            Toutes les communes
          </Link>
          {" · "}
          <Link href="/" className="text-forest underline-offset-2 hover:underline">
            Le Bon Voisin
          </Link>
        </p>
      </div>
    </div>
  );
}
