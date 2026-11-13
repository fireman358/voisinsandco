"use client";

import { MapPin } from "lucide-react";
import type { Business } from "@/lib/types";
import { formatDistance } from "@/lib/format";

interface BusinessMapProps {
  items: Business[];
  center: { lat: number; lng: number };
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const TIER_FILL: Record<string, string> = {
  pro: "#D97706",
  verified: "#15803D",
  standard: "#A3A3A3",
};

export function BusinessMap({ items, center, selectedId, onSelect }: BusinessMapProps) {
  const kmPerDegLat = 111.32;
  const kmPerDegLng = 111.32 * Math.cos((center.lat * Math.PI) / 180);
  const pad = 0.9;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const pts = items.map((b) => {
    const x = (b.lng - center.lng) * kmPerDegLng;
    const y = (center.lat - b.lat) * kmPerDegLat;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    return { ...b, x, y };
  });

  if (items.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-sm text-neutral-400">
        Rien à afficher sur la carte dans ce rayon
      </div>
    );
  }

  const w = Math.max(maxX - minX, 1.5) + pad * 2;
  const h = Math.max(maxY - minY, 1.5) + pad * 2;
  const ox = pad - minX;
  const oy = pad - minY;
  const r = Math.max(0.45, Math.min(w, h) * 0.055);

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-[#EDF3EC]">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-72 w-full" role="img" aria-label="Carte du périmètre">
          <line x1={ox} y1={0} x2={ox} y2={h} stroke="#D8E4D6" strokeWidth={0.06} />
          <line x1={0} y1={oy} x2={w} y2={oy} stroke="#D8E4D6" strokeWidth={0.06} />
          <circle cx={ox} cy={oy} r={r * 1.9} fill="#FFFFFF" fillOpacity={0.55} stroke="#15803D" strokeWidth={0.12} />
          <circle cx={ox} cy={oy} r={r * 0.65} fill="#15803D" />
          {pts.map((p) => {
            const isSelected = p.id === selectedId;
            return (
              <circle
                key={p.id}
                cx={p.x + ox}
                cy={p.y + oy}
                r={isSelected ? r * 1.7 : r}
                fill={TIER_FILL[p.tier]}
                stroke="#FFFFFF"
                strokeWidth={0.14}
                className="cursor-pointer transition-all hover:opacity-80"
                onClick={() => onSelect(p.id)}
              >
                <title>
                  {p.name} — {formatDistance(p.distanceKm)} • {p.town}
                </title>
              </circle>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-forest ring-2 ring-white" /> Votre position
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-accent" /> Pro
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-forest" /> Vérifiée
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-neutral-400" /> Standard
        </span>
        <span className="inline-flex items-center gap-1 text-neutral-400">
          <MapPin className="size-3" /> touchez un point pour la fiche
        </span>
      </div>
    </div>
  );
}
