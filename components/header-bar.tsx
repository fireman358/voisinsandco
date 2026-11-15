"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Database, LocateFixed } from "lucide-react";
import { NeighbourhoodMotif } from "@/components/neighbourhood-motif";
import { FontSizeControl } from "@/components/font-size-control";
import { InstallAppButton } from "@/components/install-app-button";
import { RADIUS_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { GeoState } from "@/lib/types";

interface HeaderBarProps {
  geo: GeoState;
  radius: number;
  demo: boolean;
  count: number;
  onRadiusChange: (radius: number) => void;
  onUseGps: () => void;
}

export function HeaderBar({
  geo,
  radius,
  demo,
  count,
  onRadiusChange,
  onUseGps,
}: HeaderBarProps) {
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

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-forest-950 text-white shadow-lg backdrop-blur">
      <NeighbourhoodMotif className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.05]" />
      <div className="relative mx-auto w-full max-w-3xl px-4 py-2.5 md:max-w-5xl xl:max-w-7xl">
        <div className="flex items-center justify-between gap-3 md:grid md:grid-cols-[1fr_auto_1fr]">
          <div className="hidden md:block" aria-hidden="true" />
          <div className="min-w-0 md:text-center">
            <h1 className="text-2xl font-extrabold leading-none tracking-tight text-white md:text-3xl">LBV</h1>
            <p className="mt-0.5 text-[12px] font-semibold text-white/85 md:text-sm">Le Bon Voisin</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 md:justify-end">
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
              aria-label={collapsed ? "Afficher les réglages" : "Réduire la barre"}
              title={collapsed ? "Afficher les réglages" : "Réduire la barre (plus de liste visible)"}
              className="rounded-lg bg-white/10 p-1.5 text-white/80 hover:bg-white/20"
            >
              {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
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
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onUseGps}
                  aria-label="Utiliser ma position (GPS)"
                  title="Utiliser ma position actuelle (GPS)"
                  className="rounded-lg bg-white/10 p-1.5 text-white/80 hover:bg-white/20"
                >
                  <LocateFixed className="size-3.5" />
                </button>
                <span className="truncate text-[11px] text-white/45">autour de {geo.shortLabel}</span>
              </div>
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
