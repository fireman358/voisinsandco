import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listAllTowns } from "@/lib/data";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Toutes les communes — Le Bon Voisin",
  description: "Annuaire local par commune : retrouvez les commerces, artisans et services de votre ville.",
  alternates: { canonical: "/communes" },
};

export default async function CommunesPage() {
  const towns = await listAllTowns();
  const sorted = [...towns].sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-dvh bg-paper px-4 py-6">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <Link href="/" className="flex items-center gap-1 text-sm font-medium text-forest">
          <ArrowLeft className="size-4" /> Le Bon Voisin
        </Link>

        <header className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Annuaire local</p>
          <h1 className="text-2xl font-extrabold text-neutral-900">Toutes les communes</h1>
          <p className="text-sm text-neutral-600">
            {towns.length} communes et localités référencées. Choisis ta commune pour voir ses commerces et artisans.
          </p>
        </header>

        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((t) => (
            <li key={t.town}>
              <Link
                href={`/commune/${slugify(t.town)}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm transition-colors hover:border-forest/40"
              >
                <span className="truncate font-medium text-neutral-800">{t.town}</span>
                <span className="shrink-0 text-xs text-neutral-400">{t.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
