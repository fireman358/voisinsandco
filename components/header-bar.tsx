"use client";

import { useMemo, useState } from "react";
import communesJson from "@/lib/communes.json";
import { ChevronDown, Database, LocateFixed, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { BASE_POINTS, RADIUS_OPTIONS } from "@/lib/seed";
import type { GeoState } from "@/lib/types";

const COMMUNES = communesJson as { name: string; lat: number; lng: number }[];

interface HeaderBarProps {
  geo: GeoState;
  baseKey: string;
  radius: number;
  demo: boolean;
  count: number;
  onBaseChange: (key: string) => void;
  onRadiusChange: (radius: number) => void;
  onCitySelect: (city: { name: string; lat: number; lng: number }) => void;
}

export function HeaderBar({
  geo,
  baseKey,
  radius,
  demo,
  count,
  onBaseChange,
  onRadiusChange,
  onCitySelect,
}: HeaderBarProps) {
  const sliderIndex = Math.max(0, RADIUS_OPTIONS.indexOf(radius));
  const [cityQuery, setCityQuery] = useState("");

  const cityMatches = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return COMMUNES.filter((c) => c.name.toLowerCase().startsWith(q)).slice(0, 8);
  }, [cityQuery]);

  const pickCity = (name: string) => {
    const c = COMMUNES.find((x) => x.name === name);
    if (c) {
      onCitySelect(c);
      setCityQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto w-full max-w-3xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-anthracite shadow-sm">
              <Users className="size-5 text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-ink">Voisins &amp; Co</h1>
              <p className="text-xs text-neutral-500">
                Économie locale &amp; entraide
              </p>
            </div>
          </div>
          {demo && (
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <Database className="size-3" /> Données de démo (D1 non liée)
            </Badge>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-forest" />
            <select
              value={baseKey}
              onChange={(e) => onBaseChange(e.target.value)}
              aria-label="Camp de base"
              className="h-10 w-full appearance-none rounded-xl border border-neutral-200 bg-white pl-9 pr-8 text-sm font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-forest/30"
            >
              {BASE_POINTS.map((p) => (
                <option key={p.key} value={p.key}>
                  Camp de base : {p.label}
                </option>
              ))}
              {baseKey === "__city" && (
                <option value="__city">Ville : {geo.shortLabel}</option>
              )}
              <option value="__geo">📍 Position actuelle</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onBaseChange("__geo")}
            title="Utiliser ma position actuelle"
            aria-label="Utiliser ma position actuelle"
          >
            <LocateFixed className="size-4" />
          </Button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-accent-dark" />
            <Input
              list="communes-list"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              onBlur={() => {
                if (cityMatches.length > 0) pickCity(cityMatches[0].name);
              }}
              placeholder="Visiter une ville wallonne (ex. Dinant, Namur…)"
              className="h-10 pl-9 text-sm font-medium"
              aria-label="Rechercher une ville"
            />
            <datalist id="communes-list">
              {cityMatches.map((c) => (
                <option key={c.name} value={c.name} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="mt-2.5 rounded-xl border border-neutral-200 bg-paper px-3 py-2.5">
          <div className="flex items-center justify-between gap-2 text-xs font-medium text-neutral-600">
            <span>Rayon de recherche</span>
            <span className="whitespace-nowrap rounded-md bg-forest px-2 py-0.5 text-white">
              {radius} km autour de {geo.shortLabel}
            </span>
          </div>
          <Slider
            value={[sliderIndex]}
            min={0}
            max={RADIUS_OPTIONS.length - 1}
            step={1}
            onValueChange={([i]) => onRadiusChange(RADIUS_OPTIONS[i])}
            className="mt-2.5"
            aria-label="Rayon de recherche en kilomètres"
          />
          <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
            {RADIUS_OPTIONS.map((r) => (
              <span key={r}>{r} km</span>
            ))}
          </div>
        </div>

        <p className="mt-2 text-xs text-neutral-500">
          {count} adresse{count > 1 ? "s" : ""} dans le périmètre • distances en ligne droite (Haversine)
        </p>
      </div>
    </header>
  );
}
