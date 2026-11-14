/**
 * Garde-fous côté serveur pour les routes d'écriture publiques (sans compte).
 *
 * Le rate-limit est en mémoire (par isolat Cloudflare Workers) : c'est une
 * première ligne de défense « best effort ». Pour une protection stricte,
 * complète avec le rate-limiting WAF de Cloudflare (règles par chemin).
 */

export const LIMITS = {
  title: 120,
  description: 2000,
  author: 60,
  name: 120,
  owner: 60,
  town: 80,
  phone: 40,
  email: 200,
  message: 2000,
  website: 300,
  hours: 200,
  news: 500,
  organizer: 120,
  type: 60,
  date: 40,
  location: 300,
  requester: 60,
  dates: 200,
  businessId: 120,
  dealId: 120,
  toolId: 120,
  bce: 30,
  reason: 300,
} as const;

type StringBody = Record<string, unknown>;

/** Renvoie le nom du premier champ qui dépasse sa limite, ou null si tout est OK. */
export function overLimit(body: StringBody, limits: Record<string, number>): string | null {
  for (const [key, max] of Object.entries(limits)) {
    const value = body[key];
    if (typeof value === "string" && value.length > max) {
      return `${key} dépasse ${max} caractères`;
    }
  }
  return null;
}

const WINDOW_MS = 60_000;
const buckets = new Map<string, { n: number; reset: number }>();

/** true = limite atteinte (à refuser). */
export function rateLimited(key: string, limit = 10): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + WINDOW_MS });
    return false;
  }
  if (b.n >= limit) return true;
  b.n++;
  return false;
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
