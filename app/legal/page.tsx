import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Mentions légales — Voisins & Co" };

export default function LegalPage() {
  return (
    <div className="min-h-dvh bg-paper px-4 py-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-neutral-900">Mentions légales &amp; confidentialité</h1>
          <Link href="/" className="flex items-center gap-1 text-sm font-medium text-forest">
            <ArrowLeft className="size-4" /> Retour
          </Link>
        </div>

        <section className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
          <h2 className="font-bold text-neutral-900">Éditeur</h2>
          <p>
            Voisins &amp; Co est une application indépendante éditée par <strong>Edukisto</strong> —
            « Votre informaticien de proximité » (<a className="font-medium text-accent-dark underline" href="https://edukisto.win/">edukisto.win</a>),
            zone Seneffe / Lillois. Contact : via le formulaire de revendication dans l&apos;application ou le site edukisto.win.
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
          <h2 className="font-bold text-neutral-900">Données des commerces — OpenStreetMap</h2>
          <p>
            Les fiches Standard de l&apos;annuaire proviennent d&apos;OpenStreetMap et sont réutilisées sous licence
            <strong> Open Database License (ODbL)</strong>. Crédit : « © les contributeurs d&apos;OpenStreetMap » —
            <a className="font-medium text-accent-dark underline" href="https://www.openstreetmap.org/copyright"> openstreetmap.org/copyright</a>.
            Les horaires, coordonnées et catégories sont fournis à titre indicatif : seules les fiches revendiquées
            (badge « Vérifiée ») sont maintenues par le commerçant lui-même.
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
          <h2 className="font-bold text-neutral-900">Confidentialité (RGPD)</h2>
          <p>L&apos;application ne nécessite aucune inscription et ne dépose aucun cookie publicitaire ou traceur.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Position</strong> : la géolocalisation reste sur votre appareil ; aucune position n&apos;est
              stockée côté serveur.
            </li>
            <li>
              <strong>Revendication d&apos;une fiche</strong> : nom, e-mail et téléphone ne servent qu&apos;à vérifier
              que vous gérez le commerce ; conservés le temps du traitement, puis supprimés sur demande.
            </li>
            <li>
              <strong>Mur des besoins / Boîte à outils</strong> : contenus communautaires publiés sous pseudo de
              quartier ; pas de données personnelles requises.
            </li>
            <li>
              <strong>Abonnements</strong> : paiement par virement ; aucune donnée bancaire n&apos;est collectée ni
              hébergée par l&apos;application.
            </li>
          </ul>
          <p>
            Droits d&apos;accès, de rectification et d&apos;effacement : contact via <a className="font-medium text-accent-dark underline" href="https://edukisto.win/">edukisto.win</a>.
          </p>
        </section>

        <section className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
          <h2 className="font-bold text-neutral-900">Abonnements des fiches</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Fiche Standard : gratuite, pré-remplie depuis OpenStreetMap.</li>
            <li>Fiche Vérifiée : gratuite après vérification de la gérance.</li>
            <li>Pack Visibilité : 9 €/mois sans engagement.</li>
            <li>Pack Pro : 29 €/mois sans engagement ; mise en avant exclusive de secteur : +5 €/mois, premier demandeur servi.</li>
            <li>Formule annuelle : 12 mois pour le prix de 10 (2 mois offerts).</li>
            <li>Paiement par virement (unique, permanent ou annuel) ; QR code de paiement envoyé par e-mail ; rappel automatique avant échéance. Aucun prélèvement automatique.</li>
          </ul>
        </section>

        <p className="pb-6 text-center text-xs text-neutral-400">
          Une réalisation <a className="font-medium text-accent-dark underline" href="https://edukisto.win/">Edukisto</a> · Données © les contributeurs d&apos;OpenStreetMap
        </p>
      </div>
    </div>
  );
}
