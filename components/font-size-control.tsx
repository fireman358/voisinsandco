"use client";

import { useEffect, useState } from "react";
import { applyFontSize, getFontSize, setFontSize, type FontSize } from "@/lib/preferences";

const OPTIONS: { key: FontSize; label: string; cls: string }[] = [
  { key: "sm", label: "Petit", cls: "text-[11px]" },
  { key: "md", label: "Normal", cls: "text-sm" },
  { key: "lg", label: "Grand", cls: "text-base" },
];

/** Petit sélecteur « Aa » de taille de texte, mémorisé entre les visites. */
export function FontSizeControl({ className }: { className?: string }) {
  const [size, setSize] = useState<FontSize>("md");

  useEffect(() => {
    const current = getFontSize();
    applyFontSize(current);
    setSize(current);
  }, []);

  const choose = (next: FontSize) => {
    setSize(next);
    setFontSize(next);
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className ?? ""}`} role="group" aria-label="Taille du texte">
      <span className="mr-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-60">Aa</span>
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => choose(o.key)}
          aria-pressed={size === o.key}
          title={`Texte ${o.label.toLowerCase()}`}
          className={`rounded-md px-1.5 py-0.5 font-semibold leading-none transition-colors ${
            size === o.key ? "bg-accent text-forest-950" : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          <span className={o.cls}>{o.label[0]}</span>
        </button>
      ))}
    </div>
  );
}
