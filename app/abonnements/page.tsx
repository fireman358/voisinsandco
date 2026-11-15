import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Check, Crown, Eye, Sparkles, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Les formules — Voisins & Co",
  description:
    "Fiche gratuite, Vérifiée, Visibilité 9 €, Pro 29 € et Prime +5 € : les formules de visibilité pour les commerces et artisans de proximité.",
};

interface Pack {
  name: string;
  price: string;
  tagline: string;
  icon: typeof Eye;
  features: string[];
  highlight?: boolean;
}

const PACKS: Pack[] = [
  {
    name: "Standard",
    price: "Gratuit",
    tagline: "Ta fiche existe déjà (BCE / OpenStreetMap).",
    icon: Sparkles,
    features: ["Visible dans ton périmètre", "Adresse et numéro BCE", "Bouton « C'est mon commerce ? Revendiquer »"],
  },
  {
    name: "Vérifiée",
    price: "Gratuit",
    tagline: "Après vérification du gérant.",
    icon: BadgeCheck,
    features: ["Badge vert « Vérifiée »", "Téléphone affiché", "Rassure les voisins"],
  },
  {
    name: "Visibilité",
    price: "9 € / mois",
    tagline: "Pour rester à jour et présent.",
    icon: Eye,
    features: ["Horaires d'ouverture", "Photo de vitrine", "Publication d'actualités"],
  },
  {
    name: "Pro",
    price: "29 € / mois",
    tagline: "Pour aller chercher des clients.",
    icon: Zap,
    features: ["Lien vers ton site / réseaux", "Offres flash à 10 km", "Tête de liste dans ta catégorie", "Badge « Pro »"],
    highlight: true,
  },
  {
    name: "Prime",
    price: "+5 € / mois",
    tagline: "Mise en avant exclusive de secteur.",
    icon: Crown,
    features: ["Passe au-dessus des fiches Pro", "Un seul commerce par catégorie et secteur", "Premier demandeur servi"],
  },
];

export default function AbonnementsPage() {
  return (
    <div className="min-h-dvh bg-paper px-4 py-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900">Les formules</h1>
          <Link href="/" className="flex items-center gap-1 text-sm font-medium text-forest">
            <ArrowLeft className="size-4" /> Retour à l&apos;appli
          </Link>
        </div>

        <p className="text-sm text-neutral-600">
          Voisins &amp; Co référence les commerces et artisans de ta commune. La fiche de base est
          gratuite ; les formules payantes te donnent plus de visibilité auprès des voisins. Paiement
          simple par virement (unique, permanent ou annuel). <strong>12 mois payés pour 10</strong> sur
          les formules annuelles.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PACKS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.name}
                className={`flex flex-col rounded-2xl border p-4 ${
                  p.highlight
                    ? "border-accent/60 bg-accent-light/40"
                    : "border-neutral-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-forest text-white">
                    <Icon className="size-4.5" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900">{p.name}</p>
                    <p className="font-mono text-sm font-semibold text-forest">{p.price}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-neutral-500">{p.tagline}</p>
                <ul className="mt-3 space-y-1.5 text-xs text-neutral-700">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-forest" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <section className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
          <h2 className="font-bold text-neutral-900">Comment souscrire ?</h2>
          <p>
            Dans l&apos;annuaire, clique sur <strong>« C&apos;est votre commerce ? Revendiquer »</strong>{" "}
            sur ta fiche. On vérifie que tu es bien le gérant (n° BCE, téléphone, passage en boutique),
            puis on active la formule choisie. La fiche <strong>Vérifiée</strong> est gratuite.
          </p>
          <p>
            Les formules payantes sont activées après contact, sans prélèvement automatique : un
            virement suffit, et un QR code de paiement t&apos;est envoyé.
          </p>
        </section>

        <p className="text-center">
          <Link href="/" className="text-sm font-semibold text-forest underline-offset-2 hover:underline">
            ← Découvrir les commerces près de chez moi
          </Link>
        </p>
      </div>
    </div>
  );
}
