"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Clock,
  Globe,
  List,
  Map as MapIcon,
  MapPin,
  Megaphone,
  Navigation,
  Phone,
  Search,
  SearchX,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessMap } from "@/components/business-map";
import { ClaimDialog } from "@/components/claim-dialog";
import { formatDistance } from "@/lib/format";
import {
  CATEGORY_LABELS,
  subcategoryLabel,
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

function TierBadge({ tier }: { tier: Business["tier"] }) {
  if (tier === "pro") {
    return (
      <Badge variant="amber" className="gap-1">
        <Zap className="size-3" /> Pro
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
  return (
    <Card className={cn("overflow-hidden", b.tier === "pro" && "border-accent/70 bg-accent-light/40")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{b.name}</CardTitle>
          <TierBadge tier={b.tier} />
        </div>
        <CardDescription>{b.description}</CardDescription>
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
        {b.hours && (
          <p className="flex items-center gap-1.5 text-xs text-neutral-600">
            <Clock className="size-3.5 text-forest" />
            {b.hours}
          </p>
        )}
        {b.subcategory && (
          <span className="inline-flex w-fit rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
            {subcategoryLabel(b.subcategory)}
          </span>
        )}
        {b.news && b.tier === "pro" && (
          <p className="flex items-start gap-1.5 rounded-lg bg-accent-light px-2.5 py-1.5 text-xs font-medium text-accent-dark">
            <Megaphone className="mt-0.5 size-3.5 shrink-0" />
            {b.news}
          </p>
        )}
        {b.bce && <p className="text-[11px] text-neutral-400">N° BCE : {b.bce}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          {telHref && (
            <Button asChild variant="secondary" size="sm">
              <a href={telHref}>
                <Phone className="size-3.5" /> Appeler
              </a>
            </Button>
          )}
          {b.website && (
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
          {b.tier === "standard" && (
            <Button variant="outline" size="sm" onClick={() => onClaim(b)}>
              C&apos;est votre commerce ? Revendiquer
            </Button>
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
}: {
  businesses: Business[];
  loading: boolean;
  center: { lat: number; lng: number };
}) {
  const [category, setCategory] = useState<BusinessCategory | "all">("all");
  const [view, setView] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [claimTarget, setClaimTarget] = useState<Business | null>(null);
  const [query, setQuery] = useState("");
  const [subcat, setSubcat] = useState<string>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const byCategory = useMemo(
    () => (category === "all" ? businesses : businesses.filter((b) => b.category === category)),
    [businesses, category],
  );

  const subcats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of byCategory) {
      if (b.subcategory) counts.set(b.subcategory, (counts.get(b.subcategory) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);
  }, [byCategory]);

  const filtered = useMemo(() => {
    const needle = normalizeText(query.trim());
    return byCategory.filter(
      (b) =>
        (subcat === "all" || b.subcategory === subcat) &&
        (needle === "" ||
          normalizeText(b.name).includes(needle) ||
          normalizeText(b.town).includes(needle) ||
          normalizeText(b.address).includes(needle)),
    );
  }, [byCategory, subcat, query]);

  const selected = filtered.find((b) => b.id === selectedId) ?? null;
  const visibleItems = filtered.slice(0, visible);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-neutral-900">Commerces &amp; artisans du périmètre</h2>
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

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
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
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              setSubcat("all");
              setVisible(PAGE_SIZE);
            }}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              subcat === "all"
                ? "border-accent-dark bg-accent-dark text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-accent-dark/40",
            )}
          >
            Toutes activités
          </button>
          {subcats.map(([key, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setSubcat(key);
                setVisible(PAGE_SIZE);
              }}
              className={cn(
                "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                subcat === key
                  ? "border-accent-dark bg-accent-dark text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-accent-dark/40",
              )}
            >
              {subcategoryLabel(key)} ({count})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-neutral-400">Mise à jour du périmètre…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white py-10 text-center">
          <SearchX className="size-8 text-neutral-300" />
          <p className="text-sm text-neutral-500">
            Aucune adresse dans ce rayon — essayez 10 ou 15 km.
          </p>
        </div>
      ) : view === "map" ? (
        <div className="space-y-3">
          <BusinessMap
            items={filtered}
            center={center}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
          />
          {selected && <BusinessCard b={selected} onClaim={setClaimTarget} />}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((b) => (
            <BusinessCard key={b.id} b={b} onClaim={setClaimTarget} />
          ))}
          {filtered.length > visibleItems.length && (
            <Button variant="outline" className="w-full" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
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
    </div>
  );
}
