"use client";

import { useMemo, useState } from "react";
import {
  Apple,
  BadgeCheck,
  Beef,
  Beer,
  Book,
  Calculator,
  Camera,
  Candy,
  Car,
  ChevronDown,
  Clock,
  Coffee,
  Cheese,
  Croissant,
  Crown,
  Dumbbell,
  Flower,
  Footprints,
  Fuel,
  Gamepad2,
  Gem,
  Glasses,
  Globe,
  GraduationCap,
  Hammer,
  HardHat,
  Heart,
  House,
  Landmark,
  Leaf,
  List,
  Map as MapIcon,
  MapPin,
  Megaphone,
  Monitor,
  Music,
  Navigation,
  Palette,
  Paintbrush,
  Phone,
  Pill,
  Plane,
  Plus,
  Scale,
  Scissors,
  Search,
  SearchX,
  ShieldCheck,
  Shirt,
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Truck,
  Utensils,
  UtensilsCrossed,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BusinessMap } from "@/components/business-map";
import { ClaimDialog } from "@/components/claim-dialog";
import { ShareButton } from "@/components/share-button";
import { AddBusinessDialog } from "@/components/add-business-dialog";
import { ListSkeleton } from "@/components/skeletons";
import { formatDistance } from "@/lib/format";
import {
  CATEGORY_LABELS,
  SUBCATEGORY_GROUP_LABELS,
  activityKey,
  activityLabel,
  type Business,
  type BusinessCategory,
} from "@/lib/types";
import { cn, normalizeText } from "@/lib/utils";

const CATEGORIES: { key: BusinessCategory | "all"; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "alimentation", label: "Alimentation & Fermes" },
  { key: "artisan", label: "Artisans & Services" },
  { key: "horeca", label: "Horeca" },
  { key: "distributeur", label: "Distributeurs 24/7" },
];

const PAGE_SIZE = 50;

// Icône par activité précise — un informaticien n'a pas besoin d'un marteau.
const ACTIVITY_ICON: Record<string, LucideIcon> = {
  informatique: Monitor,
  medecin: Stethoscope,
  dentiste: Stethoscope,
  kine: Stethoscope,
  veterinaire: Stethoscope,
  pharmacie: Pill,
  opticien: Glasses,
  coiffeur: Scissors,
  esthetique: Sparkles,
  avocat: Scale,
  notaire: Scale,
  comptabilite: Calculator,
  agence_immobiliere: House,
  architecte: House,
  construction: HardHat,
  maconnerie: HardHat,
  terrassement: HardHat,
  menuiserie: Hammer,
  cuisines: Hammer,
  plomberie_chauffage: Wrench,
  electricien: Zap,
  couvreur: HardHat,
  peinture: Paintbrush,
  carrelage_sols: Paintbrush,
  isolation: Paintbrush,
  nettoyage: Paintbrush,
  jardinage: Leaf,
  fleuriste: Flower,
  animalerie: Leaf,
  garage: Car,
  carburant_recharge: Fuel,
  boulangerie: Croissant,
  boucherie: Beef,
  primeurs: Apple,
  supermarche: ShoppingBasket,
  epicerie: ShoppingBasket,
  fromagerie: Cheese,
  chocolaterie: Candy,
  restaurant: Utensils,
  fast_food: Utensils,
  cafe: Coffee,
  bar_pub: Beer,
  librairie: Book,
  papeterie: Book,
  jouets: Gamepad2,
  articles_sport: Dumbbell,
  vetements: Shirt,
  chaussures: Footprints,
  bijouterie: Gem,
  horloger: Gem,
  electronique: Monitor,
  gsm: Monitor,
  hifi_tv: Monitor,
  musique: Music,
  instruments: Music,
  galerie_art: Palette,
  quincaillerie: Wrench,
  bricolage: Wrench,
  photographe: Camera,
  communication_design: Palette,
  agence_voyage: Plane,
  enseignement: GraduationCap,
  assurance: ShieldCheck,
  banque: Landmark,
  asbl_ong: Heart,
  pompes_funebres: Heart,
  pressing: Shirt,
  repassage: Shirt,
  laverie: Shirt,
  couture: Scissors,
  cordonnier: Scissors,
  demagement: Truck,
  securite: ShieldCheck,
  pressing_2: Shirt,
};

const CATEGORY_ICON: Record<BusinessCategory, LucideIcon> = {
  alimentation: ShoppingBasket,
  artisan: Hammer,
  horeca: UtensilsCrossed,
  distributeur: ShoppingCart,
};

const CATEGORY_TINT: Record<BusinessCategory, string> = {
  alimentation: "bg-green-50 text-forest",
  artisan: "bg-accent-light text-accent-dark",
  horeca: "bg-amber-50 text-amber-600",
  distributeur: "bg-neutral-100 text-neutral-600",
};

function TierBadge({ tier, prime }: { tier: Business["tier"]; prime?: boolean }) {
  if (prime) {
    return (
      <Badge variant="amber" className="gap-1">
        <Crown className="size-3" /> Prime
      </Badge>
    );
  }
  if (tier === "pro") {
    return (
      <Badge variant="amber" className="gap-1">
        <Zap className="size-3" /> Pro
      </Badge>
    );
  }
  if (tier === "visibility") {
    return (
      <Badge variant="default" className="gap-1 border border-accent/60 bg-accent-light text-accent-dark">
        <Clock className="size-3" /> Visibilité
      </Badge>
    );
  }
  if (tier === "verified") {
    return (
      <Badge variant="default" className="gap-1">
        <BadgeCheck className="size-3" /> Vérifiée
      </Badge>
    );
  }
  return <Badge variant="secondary">Standard</Badge>;
}

function BusinessCard({ b, onClaim }: { b: Business; onClaim: (b: Business) => void }) {
  const telHref = b.phone ? `tel:${b.phone.replace(/[^+\d]/g, "")}` : null;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`;
  const Icon = ACTIVITY_ICON[activityKey(b.subcategory)] ?? CATEGORY_ICON[b.category] ?? ShoppingBasket;
  return (
    <Card className={cn("lift overflow-hidden", b.tier === "pro" && "border-accent/70 bg-accent-light/40")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                CATEGORY_TINT[b.category],
              )}
              aria-hidden="true"
            >
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">{b.name}</CardTitle>
              <CardDescription className="truncate">
                {b.tier !== "standard"
                  ? b.bce
                    ? "Entreprise authentifiée : enregistrée et active à la BCE, gérant vérifié."
                    : "Commerçant authentifié : gérant vérifié par nos soins."
                  : b.description}
              </CardDescription>
            </div>
          </div>
          <TierBadge tier={b.tier} prime={b.prime} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-forest">
            <MapPin className="size-3.5" />
            {formatDistance(b.distanceKm)} • {b.town} {b.postalCode}
          </span>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600">
            {CATEGORY_LABELS[b.category]}
          </span>
        </div>
        <p className="text-xs text-neutral-500">{b.address}</p>
        {b.hours && (b.tier === "visibility" || b.tier === "pro") && (
          <p className="flex items-center gap-1.5 text-xs text-neutral-600">
            <Clock className="size-3.5 text-forest" />
            {b.hours}
          </p>
        )}
        {b.subcategory && (
          <span className="inline-flex w-fit rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
            {activityLabel(b.subcategory)}
          </span>
        )}
        {b.news && b.tier === "pro" && (
          <p className="flex items-start gap-1.5 rounded-lg bg-accent-light px-2.5 py-1.5 text-xs font-medium text-accent-dark">
            <Megaphone className="mt-0.5 size-3.5 shrink-0" />
            {b.news}
          </p>
        )}
        {b.bce && <p className="font-mono text-[11px] text-neutral-400">N° BCE : {b.bce}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          {telHref && b.tier !== "standard" && (
            <Button asChild variant="secondary" size="sm">
              <a href={telHref}>
                <Phone className="size-3.5" /> Appeler
              </a>
            </Button>
          )}
          {b.website && b.tier === "pro" && (
            <Button asChild variant="secondary" size="sm">
              <a href={b.website} target="_blank" rel="noreferrer">
                <Globe className="size-3.5" /> Site web
              </a>
            </Button>
          )}
          <Button asChild variant="secondary" size="sm">
            <a href={directions} target="_blank" rel="noreferrer">
              <Navigation className="size-3.5" /> Itinéraire
            </a>
          </Button>
          <ShareButton title={b.name} text={`${b.name} — ${b.town} sur Voisins & Co`} />
          {b.tier === "standard" && !b.id.startsWith("user-") && (
            <Button variant="outline" size="sm" onClick={() => onClaim(b)}>
              C&apos;est votre commerce ? Revendiquer
            </Button>
          )}
          {b.id.startsWith("user-") && (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-forest">
              Ajoutée par le gérant
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnnuaireTab({
  businesses,
  loading,
  center,
  geoShortLabel,
  searchQuery,
  onSearchQueryChange,
  onCreated,
}: {
  businesses: Business[];
  loading: boolean;
  center: { lat: number; lng: number };
  geoShortLabel: string;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onCreated: (b: Business) => void;
}) {
  const [category, setCategory] = useState<BusinessCategory | "all">("all");
  const [view, setView] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [claimTarget, setClaimTarget] = useState<Business | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [subcat, setSubcat] = useState<string>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [catDialog, setCatDialog] = useState(false);
  const [catSearch, setCatSearch] = useState("");

  const byCategory = useMemo(
    () => (category === "all" ? businesses : businesses.filter((b) => b.category === category)),
    [businesses, category],
  );

  const subcats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of byCategory) {
      const key = activityKey(b.subcategory);
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [byCategory]);

  const groupedSubcats = useMemo(() => {
    const counts = new Map<string, number>();
    const catOf = new Map<string, BusinessCategory>();
    for (const b of businesses) {
      const key = activityKey(b.subcategory);
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (!catOf.has(key)) catOf.set(key, b.category);
    }
    const byMain = new Map<BusinessCategory, { key: string; label: string; count: number }[]>();
    for (const [key, count] of counts) {
      const cat = catOf.get(key) as BusinessCategory;
      const list = byMain.get(cat) ?? [];
      list.push({ key, label: SUBCATEGORY_GROUP_LABELS[key] ?? activityLabel(key), count });
      byMain.set(cat, list);
    }
    for (const list of byMain.values()) list.sort((a, b) => a.label.localeCompare(b.label, "fr"));
    const catalog = Object.keys(SUBCATEGORY_GROUP_LABELS)
      .filter((k) => !counts.has(k))
      .map((k) => ({ key: k, label: SUBCATEGORY_GROUP_LABELS[k], count: 0 }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));
    return { byMain, catalog };
  }, [businesses]);

  const filtered = useMemo(() => {
    const needle = normalizeText(searchQuery.trim());
    return byCategory.filter(
      (b) =>
        (subcat === "all" || activityKey(b.subcategory) === subcat) &&
        (needle === "" ||
          normalizeText(b.name).includes(needle) ||
          normalizeText(b.town).includes(needle) ||
          normalizeText(b.address).includes(needle) ||
          normalizeText(activityLabel(b.subcategory)).includes(needle) ||
          normalizeText(CATEGORY_LABELS[b.category]).includes(needle)),
    );
  }, [byCategory, subcat, searchQuery]);

  const selected = filtered.find((b) => b.id === selectedId) ?? null;
  const visibleItems = filtered.slice(0, visible);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-neutral-900">Commerces &amp; artisans du périmètre</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="size-3.5" /> Ajouter
          </Button>
          <div className="flex rounded-xl border border-neutral-200 bg-white p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1.5",
                view === "list" ? "bg-forest text-white" : "text-neutral-500",
              )}
            >
              <List className="size-3.5" /> Liste
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1.5",
                view === "map" ? "bg-forest text-white" : "text-neutral-500",
              )}
            >
              <MapIcon className="size-3.5" /> Carte
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        <Input
          value={searchQuery}
          onChange={(e) => {
            onSearchQueryChange(e.target.value);
            setVisible(PAGE_SIZE);
          }}
          placeholder="Rechercher : pharmacie, boulangerie, nom, Rue…"
          className="pl-9"
        />
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              setCategory(c.key);
              setSubcat("all");
              setVisible(PAGE_SIZE);
            }}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              category === c.key
                ? "border-forest bg-forest text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-forest/40",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {subcats.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setCatDialog((o) => !o);
              setCatSearch("");
            }}
            className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-accent-dark/40 bg-accent-light px-3 text-sm font-semibold text-accent-dark"
            aria-label="Filtrer par activité"
          >
            <span className="truncate">
              {subcat === "all"
                ? `Toutes les activités (${byCategory.length})`
                : `${SUBCATEGORY_GROUP_LABELS[subcat] ?? activityLabel(subcat)}${
                    subcats.find(([k]) => k === subcat) ? ` (${subcats.find(([k]) => k === subcat)![1]})` : ""
                  }`}
            </span>
            <ChevronDown className="size-4 shrink-0" />
          </button>
          {catDialog && (
            <div className="absolute z-30 mt-1 max-h-[70dvh] w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
              <div className="border-b border-neutral-100 p-2">
                <Input
                  autoFocus
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder="Tape un mot : informatique, pharmacie…"
                  className="h-9"
                />
              </div>
              <div className="max-h-[52dvh] overflow-y-auto p-1">
                <button
                  type="button"
                  onClick={() => {
                    setSubcat("all");
                    setVisible(PAGE_SIZE);
                    setCatDialog(false);
                  }}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm font-semibold",
                    subcat === "all" ? "bg-accent-light text-accent-dark" : "text-neutral-700 hover:bg-neutral-50",
                  )}
                >
                  Toutes les activités ({byCategory.length})
                </button>
                {subcats
                  .filter(([key]) => normalizeText(SUBCATEGORY_GROUP_LABELS[key] ?? activityLabel(key)).includes(normalizeText(catSearch.trim())))
                  .map(([key, count]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSubcat(key);
                        setVisible(PAGE_SIZE);
                        setCatDialog(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm",
                        subcat === key ? "bg-accent-light font-semibold text-accent-dark" : "text-neutral-700 hover:bg-neutral-50",
                      )}
                    >
                      <span className="truncate">{SUBCATEGORY_GROUP_LABELS[key] ?? activityLabel(key)}</span>
                      <span className="shrink-0 text-xs text-neutral-400">{count}</span>
                    </button>
                  ))}
                {groupedSubcats.catalog
                  .filter((a) => normalizeText(a.label).includes(normalizeText(catSearch.trim())))
                  .slice(0, 60)
                  .map((a) => (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() => {
                        setCategory("all");
                        setSubcat(a.key);
                        setVisible(PAGE_SIZE);
                        setCatDialog(false);
                      }}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left text-sm",
                        subcat === a.key
                          ? "bg-accent-light font-semibold text-accent-dark"
                          : "text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600",
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}



      {loading && businesses.length === 0 ? (
        <ListSkeleton count={4} columns />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white py-10 text-center">
          <SearchX className="size-8 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-600">Aucune adresse dans ce rayon.</p>
          <p className="max-w-xs text-xs text-neutral-400">
            Élargis le rayon, ou tape une ville plus grande (Nivelles, La Louvière…) dans la barre du
            haut.
          </p>
        </div>
      ) : view === "map" ? (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
          <BusinessMap
            items={filtered}
            center={center}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
          />
          <div className="hidden space-y-3 lg:block lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
            {visibleItems.map((b) => (
              <BusinessCard key={b.id} b={b} onClaim={setClaimTarget} />
            ))}
          </div>
          {selected && (
            <div className="lg:hidden">
              <BusinessCard b={selected} onClaim={setClaimTarget} />
            </div>
          )}
        </div>
      ) : (
        <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((b) => (
            <BusinessCard key={b.id} b={b} onClaim={setClaimTarget} />
          ))}
          {filtered.length > visibleItems.length && (
            <Button
              variant="outline"
              className="w-full md:col-span-2 xl:col-span-3"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
            >
              Afficher 50 de plus ({filtered.length - visibleItems.length} restantes)
            </Button>
          )}
        </div>
      )}

      <ClaimDialog
        business={claimTarget}
        open={claimTarget !== null}
        onOpenChange={(o) => {
          if (!o) setClaimTarget(null);
        }}
      />
      <AddBusinessDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        geo={{ lat: center.lat, lng: center.lng, shortLabel: geoShortLabel }}
        onCreated={onCreated}
      />
    </div>
  );
}
