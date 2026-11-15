/**
 * Préférence de taille de texte (pour les personnes âgées ou les petits écrans).
 * Stockée en localStorage et appliquée sur <html data-font-size="…">, ce qui
 * met à l'échelle toutes les tailles Tailwind (rem) d'un coup.
 */

export type FontSize = "sm" | "md" | "lg";

const KEY = "voisins-font-size";

export function getFontSize(): FontSize {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "sm" || v === "md" || v === "lg") return v;
  } catch {
    /* stockage indisponible */
  }
  return "md";
}

export function applyFontSize(size: FontSize): void {
  try {
    document.documentElement.dataset.fontSize = size;
  } catch {
    /* SSR */
  }
}

export function setFontSize(size: FontSize): void {
  try {
    localStorage.setItem(KEY, size);
  } catch {
    /* stockage indisponible */
  }
  applyFontSize(size);
}
