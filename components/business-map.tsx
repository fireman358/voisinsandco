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
  pro: "#38BDF8",
  verified: "#15803D",
  standard: "#A3A3A3",
};

const TILE = 256;

function project(lat: number, lng: number, z: number) {
  const scale = TILE * 2 ** z;
  const x = ((lng + 180) / 360) * scale;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * scale;
  return { x, y };
}

export function BusinessMap({ items, center, selectedId, onSelect }: BusinessMapProps) {
  if (items.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-sm text-neutral-400">
        Rien à afficher sur la carte dans ce rayon
      </div>
    );
  }

  const lats = items.map((b) => b.lat).concat(center.lat);
  const lngs = items.map((b) => b.lng).concat(center.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Zoom : le plus grand niveau dont la zone tient dans ~4x4 tuiles (1024 px).
  let z = 16;
  for (; z > 8; z--) {
    const p1 = project(minLat, minLng, z);
    const p2 = project(maxLat, maxLng, z);
    if (Math.abs(p2.x - p1.x) <= 4 * TILE && Math.abs(p2.y - p1.y) <= 4 * TILE) break;
  }

  const p1 = project(minLat, minLng, z);
  const p2 = project(maxLat, maxLng, z);
  const padPx = 180;
  const x0 = Math.min(p1.x, p2.x) - padPx;
  const x1 = Math.max(p1.x, p2.x) + padPx;
  const y0 = Math.min(p1.y, p2.y) - padPx;
  const y1 = Math.max(p1.y, p2.y) + padPx;
  const w = x1 - x0;
  const h = y1 - y0;

  const tx0 = Math.floor(x0 / TILE);
  const tx1 = Math.floor(x1 / TILE);
  const ty0 = Math.floor(y0 / TILE);
  const ty1 = Math.floor(y1 / TILE);

  const tiles: { x: number; y: number; px: number; py: number }[] = [];
  for (let tx = tx0; tx <= tx1; tx++) {
    for (let ty = ty0; ty <= ty1; ty++) {
      if (ty < 0 || ty >= 2 ** z) continue;
      const wrappedX = ((tx % 2 ** z) + 2 ** z) % 2 ** z;
      tiles.push({ x: wrappedX, y: ty, px: tx * TILE - x0, py: ty * TILE - y0 });
    }
  }

  const centerP = project(center.lat, center.lng, z);
  const r = Math.max(9, Math.min(w, h) * 0.02);

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-[#EDF3EC]">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-72 w-full" role="img" aria-label="Carte du périmètre">
          {tiles.map((t) => (
            <image
              key={`${t.x}/${t.y}`}
              href={`https://tile.openstreetmap.org/${z}/${t.x}/${t.y}.png`}
              x={t.px}
              y={t.py}
              width={TILE}
              height={TILE}
            />
          ))}
          <circle
            cx={centerP.x - x0}
            cy={centerP.y - y0}
            r={r * 1.9}
            fill="#FFFFFF"
            fillOpacity={0.55}
            stroke="#15803D"
            strokeWidth={r * 0.28}
          />
          <circle cx={centerP.x - x0} cy={centerP.y - y0} r={r * 0.65} fill="#15803D" />
          {items.map((p) => {
            const pp = project(p.lat, p.lng, z);
            const isSelected = p.id === selectedId;
            return (
              <circle
                key={p.id}
                cx={pp.x - x0}
                cy={pp.y - y0}
                r={isSelected ? r * 1.7 : r}
                fill={TIER_FILL[p.tier]}
                stroke="#FFFFFF"
                strokeWidth={r * 0.3}
                className="cursor-pointer transition-all hover:opacity-80"
                onClick={() => onSelect(p.id)}
              >
                <title>
                  {p.name} — {formatDistance(p.distanceKm)} • {p.town}
                </title>
              </circle>
            );
          })}
          <text
            x={w - 12}
            y={h - 12}
            textAnchor="end"
            fontSize={Math.max(11, r * 1.4)}
            fill="#374151"
            className="select-none"
          >
            © OpenStreetMap
          </text>
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
