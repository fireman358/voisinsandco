"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import communesJson from "@/lib/communes.json";
import { ChevronDown, ChevronUp, Database, LocateFixed, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NeighbourhoodMotif } from "@/components/neighbourhood-motif";
import { FontSizeControl } from "@/components/font-size-control";
import { InstallAppButton } from "@/components/install-app-button";
import { RADIUS_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { GeoState } from "@/lib/types";

const COMMUNES = communesJson as { name: string; lat: number; lng: number }[];

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
  const [menuOpen, setMenuOpen] = useState(false);

  // Repli automatique : on réduit le header en défilant vers le bas, on le
  // ré-ouvre en remontant ou en revenant en haut.
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const delta = y - lastY;
        if (y < 40) setCollapsed(false);
        else if (delta > 8) setCollapsed(true);
        else if (delta < -8) setCollapsed(false);
        lastY = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-forest-950 text-white shadow-lg backdrop-blur">
      <NeighbourhoodMotif className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.05]" />
      <div className="relative mx-auto w-full max-w-3xl px-4 py-2.5 md:max-w-5xl xl:max-w-7xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold leading-none tracking-tight text-white">LBV</h1>
            <p className="mt-0.5 text-[12px] font-semibold text-white/85">Le Bon Voisin</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {demo && !collapsed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80">
                <Database className="size-3" /> Démo
              </span>
            )}
            <FontSizeControl />
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu"
                title="Menu"
                className="rounded-lg bg-white/10 px-2 py-1 text-white/80 hover:bg-white/20"
              >
                <span className="text-base leading-none">⋯</span>
              </button>
              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Fermer le menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white text-neutral-800 shadow-lg">
                    <Link
                      href="/comment-ca-marche"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm hover:bg-neutral-50"
                    >
                      Comment ça marche
                    </Link>
                    <Link
                      href="/abonnements"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm hover:bg-neutral-50"
                    >
                      Les formules
                    </Link>
                    <InstallAppButton
                      className="flex w-full items-center gap-1 px-3 py-2 text-left text-sm font-normal text-neutral-800 hover:bg-neutral-50"
                      onClick={() => setMenuOpen(false)}
                    />
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
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
            <div className="mt-2.5 flex items-center gap-2">
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

            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] font-medium text-white/55">Rayon</span>
              <div className="flex overflow-hidden rounded-lg border border-white/15">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onRadiusChange(r)}
                    aria-pressed={radius === r}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold transition-colors",
                      radius === r
                        ? "bg-accent text-forest-950"
                        : "bg-white/5 text-white/70 hover:bg-white/10",
                    )}
                  >
                    {r} km
                  </button>
                ))}
              </div>
              <span className="ml-auto truncate text-[11px] text-white/45">
                autour de {geo.shortLabel}
              </span>
            </div>

            <p className="mt-1.5 text-[11px] text-white/50">
              {count} adresse{count > 1 ? "s" : ""} dans le périmètre • distances à vol d&apos;oiseau
            </p>
          </>
        )}
      </div>
    </header>
  );
}
