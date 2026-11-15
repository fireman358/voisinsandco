import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export function normalizeText(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Slug d'URL : « Braine-l'Alleud » → « braine-l-alleud ». */
export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Slug lisible d'une fiche : « pharmacie-du-petit-moulin--bce-0892739993 ».
 * Le `--` sépare la partie lisible de l'identifiant (qui reste la clé de
 * recherche). Pas besoin de colonne supplémentaire en base.
 */
export function businessSlug(name: string, id: string): string {
  const base = slugify(name) || "fiche";
  return `${base}--${id}`;
}

/** Inverse de businessSlug : retrouve l'id et la partie lisible. */
export function parseBusinessSlug(slug: string): { id: string; nameSlug: string | null } {
  const i = slug.indexOf("--");
  if (i === -1) return { id: slug, nameSlug: null };
  return { id: slug.slice(i + 2), nameSlug: slug.slice(0, i) };
}
