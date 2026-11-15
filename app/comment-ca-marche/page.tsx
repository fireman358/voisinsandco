import Link from "next/link";
import { ArrowLeft, BadgeCheck, Clock, Crown, MapPin, Megaphone, Store, Users, Zap } from "lucide-react";

export const metadata = { title: "Comment ça marche — Le Bon Voisin" };

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Store;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-base font-bold text-neutral-900">
        <Icon className="size-4 text-forest" /> {title}
      </h2>
      <div className="space-y-2 text-sm leading-6 text-neutral-700">{children}</div>
    </section>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-dvh bg-paper px-4 py-6">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-neutral-900">Comment ça marche&nbsp;?</h1>
          <Link href="/" className="flex items-center gap-1 text-sm font-medium text-forest">
            <ArrowLeft className="size-4" /> Retour
          </Link>
        </div>

        <p className="rounded-2xl border border-forest/20 bg-green-50 p-4 text-sm leading-6 text-neutral-700">
          Le Bon Voisin est l&apos;annuaire de proximité de la Wallonie&nbsp;: les commerces, artisans et
          services qui t&apos;entourent, avec les bons plans, le mur des besoins et la boîte à outils de
          ton quartier. Tu vois ce qui se trouve autour de <strong>ta</strong> position (ou de la ville
          que tu choisis), dans un rayon de 2 à 15&nbsp;km.
        </p>

        <Section icon={MapPin} title="Pour les voisins">
          <p>
            <strong>L&apos;annuaire</strong> liste les commerces et artisans réels du secteur, issus
            d&apos;OpenStreetMap et de la Banque-Carrefour des Entreprises (BCE). Utilise la barre de
            recherche (nom, métier, ville, n° BCE) ou le filtre «&nbsp;Toutes les activités&nbsp;» pour
            affiner par métier.
          </p>
          <p>
            <strong>Les bons plans</strong> regroupent promos et anti-gaspillage des commerces du
            secteur. <strong>Le mur</strong> permet de poster un besoin ou de proposer son aide.
            <strong> La boîte à outils</strong> met en partage les objets du quartier (une pelle, une
            échelle, une remorque…). Tout est limité à ton rayon&nbsp;: ce qui est posté à Namur ne
            s&apos;affiche pas à Nivelles.
          </p>
          <p>
            Ta position est mémorisée sur ton appareil uniquement — pas de compte, pas de suivi, pas
            de cookie publicitaire.
          </p>
        </Section>

        <Section icon={Store} title="Pour les commerces, artisans et VDI">
          <p>
            Ta fiche est peut-être déjà là (plus de 250&nbsp;000 sociétés wallonnes sont pré-remplies).
            Si elle n&apos;y est pas, ajoute-la en deux minutes via le bouton «&nbsp;Ajouter&nbsp;»&nbsp;:
            nom, adresse et activité suffisent.
          </p>
          <ol className="ml-4 list-decimal space-y-2">
            <li>
              <strong>Fiche Standard (gratuite)</strong> — nom, adresse, catégorie et carte. Le
              strict minimum, comme une enseigne sur la rue.
            </li>
            <li>
              <strong>Fiche Vérifiée (gratuite)</strong> — tu revendiques ta fiche («&nbsp;Revendiquer
              cette fiche&nbsp;»), nous vérifions que tu es bien le gérant. Tu peux alors corriger ton
              nom affiché et ajouter ton numéro de téléphone. Un badge «&nbsp;Vérifiée&nbsp;» rassure
              les clients.
            </li>
            <li>
              <strong>Pack Visibilité (9&nbsp;€/mois)</strong> — tes horaires d&apos;ouverture sur ta
              fiche et tes offres du moment dans les bons plans du secteur.
            </li>
            <li>
              <strong>Pack Pro (29&nbsp;€/mois)</strong> — ton site web et tes réseaux cliquables,
              publication d&apos;actus et offres flash dans le fil des voisins à 10&nbsp;km, mise en
              avant en tête de ta catégorie, badge «&nbsp;Pro&nbsp;».
            </li>
            <li>
              <strong>Option Prime (+5&nbsp;€/mois)</strong> — exclusivité de tête de liste dans ton
              secteur, premier arrivé premier servi.
            </li>
          </ol>
          <p>
            Le paiement se fait <strong>par virement</strong> (mensuel, permanent, ou à l&apos;année
            avec 2 mois offerts) — aucun prélèvement automatique, aucun engagement. Tu reçois les
            coordonnées de virement (ou un QR-code) par e-mail après ta demande d&apos;abonnement.
          </p>
          <p>
            <strong>VDI</strong> (Thermomix, Tupperware, Softlove, vente à domicile…) — tu as ta
            place ici&nbsp;: ajoute ta fiche avec l&apos;activité «&nbsp;VDI &amp; vente à
            domicile&nbsp;» et indique ta marque dans le nom (ex.&nbsp;: «&nbsp;Marie Dupont —
            Conseillère Thermomix&nbsp;»). Les voisins qui cherchent ta marque te trouveront.
          </p>
        </Section>

        <Section icon={Users} title="D&apos;où viennent les données&nbsp;?">
          <p>
            Les fiches Standard proviennent de l&apos;union de deux sources publiques&nbsp;:
            OpenStreetMap (commerces repérés sur le terrain, © les contributeurs, licence ODbL) et
            la Banque-Carrefour des Entreprises (sociétés actives en Wallonie, géolocalisées via
            BeST Address). Les doublons sont fusionnés automatiquement. Les informations ajoutées
            par les commerçants (téléphone, horaires, site, actus) priment toujours sur les données
            publiques.
          </p>
        </Section>

        <div className="flex flex-wrap justify-center gap-3 pt-1 text-xs">
          <span className="inline-flex items-center gap-1 text-neutral-500"><BadgeCheck className="size-3.5" /> Vérifiée</span>
          <span className="inline-flex items-center gap-1 text-neutral-500"><Clock className="size-3.5" /> Visibilité</span>
          <span className="inline-flex items-center gap-1 text-neutral-500"><Zap className="size-3.5" /> Pro</span>
          <span className="inline-flex items-center gap-1 text-neutral-500"><Crown className="size-3.5" /> Prime</span>
          <span className="inline-flex items-center gap-1 text-neutral-500"><Megaphone className="size-3.5" /> Actus dans le fil</span>
        </div>
      </div>
    </div>
  );
}
