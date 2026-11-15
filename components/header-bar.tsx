"use client";

import { useEffect, useMemo, useState } from "react";
import communesJson from "@/lib/communes.json";
import { ChevronDown, ChevronUp, Database, LocateFixed, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NeighbourhoodMotif } from "@/components/neighbourhood-motif";
import { FontSizeControl } from "@/components/font-size-control";
import { RADIUS_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { GeoState } from "@/lib/types";

const COMMUNES = communesJson as { name: string; lat: number; lng: number }[];
const COLLAPSE_KEY = "voisins-header-collapsed";

interface HeaderBarProps {
  geo: GeoState;
  radius: number;
  demo: boolean;
  count: number;
  onRadiusChange: (radius: number) => void;
  onCitySelect: (city: { name: string; lat: number; lng: number }) => void;
  onUseGps: () => void;
}

export function HeaderBar({
  geo,
  radius,
  demo,
  count,
  onRadiusChange,
  onCitySelect,
  onUseGps,
}: HeaderBarProps) {
  const [cityQuery, setCityQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* stockage indisponible */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* stockage indisponible */
      }
      return next;
    });
  };

  const cityMatches = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return COMMUNES.filter((c) => c.name.toLowerCase().startsWith(q)).slice(0, 8);
  }, [cityQuery]);

  const pickCity = (raw?: string) => {
    const q = (raw ?? cityQuery).trim().toLowerCase();
    if (!q) return false;
    const c =
      COMMUNES.find((x) => x.name.toLowerCase() === q) ??
      cityMatches[0] ??
      COMMUNES.find((x) => x.name.toLowerCase().includes(q));
    if (c) {
      onCitySelect(c);
      setCityQuery("");
      return true;
    }
    return false;
  };

  return (
    <header className="sticky top-0 z-40 overflow-hidden border-b border-white/10 bg-forest-950 text-white shadow-lg backdrop-blur">
      <NeighbourhoodMotif className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.05]" />
      <div className="relative mx-auto w-full max-w-3xl px-4 py-3 lg:max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-none tracking-tight">
              Voisins <span className="text-accent">&amp;</span> Co
            </h1>
            {!collapsed && (
              <p className="mt-1 text-[11px] font-medium text-white/60">
                Économie locale &amp; entraide de voisinage
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {demo && !collapsed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80">
                <Database className="size-3" /> Démo
              </span>
            )}
            <FontSizeControl />
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Afficher la recherche" : "Réduire la barre"}
              title={collapsed ? "Afficher la recherche" : "Réduire la barre (plus de liste visible)"}
              className="rounded-lg bg-white/10 p-1.5 text-white/80 hover:bg-white/20"
            >
              {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
            <div className="mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-forest" />
                <Input
                  list="communes-list"
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      pickCity();
                    }
                  }}
                  placeholder="Ta commune (ex. Seneffe, Namur, Dinant…)"
                  className="h-10 pl-9 text-sm font-medium"
                  aria-label="Rechercher une commune"
                />
                <datalist id="communes-list">
                  {cityMatches.map((c) => (
                    <option key={c.name} value={c.name} />
                  ))}
                </datalist>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => pickCity()}
                title="Rechercher cette commune"
                aria-label="Rechercher cette commune"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <Search className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onUseGps}
                title="Utiliser ma position actuelle (GPS)"
                aria-label="Utiliser ma position actuelle"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <LocateFixed className="size-4" />
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-white/50">
              Tape ta commune puis Entrée (ou la loupe) — pas besoin de GPS.
            </p>

            <div className="mt-2.5 rounded-xl bg-white px-3 py-2.5 text-neutral-900 shadow-sm">
              <div className="flex items-center justify-between gap-2 text-xs font-medium text-neutral-600">
                <span>Rayon de recherche</span>
                <span className="whitespace-nowrap rounded-md bg-forest px-2 py-0.5 font-semibold text-white">
                  {radius} km autour de {geo.shortLabel}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onRadiusChange(r)}
                    aria-pressed={radius === r}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors",
                      radius === r
                        ? "border-forest bg-forest text-white"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-forest/40",
                    )}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-2 text-xs text-white/60">
              {count} adresse{count > 1 ? "s" : ""} dans le périmètre • distances à vol d&apos;oiseau
            </p>
          </>
        )}
      </div>
    </header>
  );
}
