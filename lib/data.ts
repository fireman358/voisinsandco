import { getCloudflareContext } from "@opennextjs/cloudflare";
import { boundingBox, haversineKm } from "./geo";
import { BUSINESSES, DEALS, EVENTS, NEEDS, TOOLS } from "./seed";
import { DEFAULT_BASE, DEFAULT_RADIUS, MAX_BUSINESS_RESULTS } from "./constants";
import { activityKey, type AgendaEvent, type Business, type BusinessCategory, type BusinessTier, type Deal, type Need, type Tool } from "./types";
import { normalizeText } from "./utils";

export interface GeoQuery {
  lat: number;
  lng: number;
  radius: number;
}

const VALID_RADII = [2, 5, 10, 15];

export function parseGeo(searchParams: URLSearchParams): GeoQuery {
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius"));
  return {
    lat: Number.isFinite(lat) && lat !== 0 ? lat : DEFAULT_BASE.lat,
    lng: Number.isFinite(lng) && lng !== 0 ? lng : DEFAULT_BASE.lng,
    radius: VALID_RADII.includes(radius) ? radius : DEFAULT_RADIUS,
  };
}

function getDB(): D1Database | null {
  try {
    const { env } = getCloudflareContext();
    return env.DB ?? null;
  } catch {
    return null;
  }
}

function withDistance<T extends { lat: number; lng: number }>(
  q: GeoQuery,
  rows: T[],
): (T & { distanceKm: number })[] {
  return rows
    .map((row) => ({ ...row, distanceKm: haversineKm(q.lat, q.lng, row.lat, row.lng) }))
    .filter((row) => row.distanceKm <= q.radius + 1e-6);
}

// Priorité d'affichage : Prime (+5 €) > Pro > Visibilité > (Vérifiée = Standard, gratuit).
// À rang égal : le plus proche d'abord, puis rotation quotidienne équitable
// (hash stable id + jour) pour qu'une fiche « Z » ne soit pas toujours en bas.
const TIER_RANK: Record<string, number> = {
  prime: 4,
  pro: 3,
  visibility: 2,
  verified: 1,
  standard: 0,
};

function rankOf(b: Business): number {
  if (b.prime) return TIER_RANK.prime;
  const base = TIER_RANK[b.tier] ?? 0;
  // Fiche ajoutée par son gérant (auto-revendiquée, pas encore vérifiée) : juste
  // au-dessus d'une fiche « standard » non revendiquée.
  if (base === 0 && b.id.startsWith("user-")) return 0.5;
  return base;
}

const DAY_NUMBER = Math.floor(Date.now() / 86_400_000);

/** Hash déterministe (FNV-1a) de `id` + numéro de jour : change chaque jour. */
function dailyHash(id: string): number {
  let h = 2166136261;
  const s = `${id}#${DAY_NUMBER}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function byTierThenDistance(a: Business, b: Business): number {
  return (
    rankOf(b) - rankOf(a) ||
    (a.distanceKm ?? 0) - (b.distanceKm ?? 0) ||
    dailyHash(a.id) - dailyHash(b.id)
  );
}

/**
 * Clé de dédoublonnage d'une fiche : nom normalisé + code postal + n° de rue.
 * Attrape les doublons OSM/BCE dont la commune est libellée différemment
 * (Feluy vs Seneffe, mêmes 7181) et l'adresse inversée.
 */
function dedupKey(b: Business): string {
  const n = b.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const num = (b.address.match(/\d+/) ?? [""])[0];
  return `${n}|${b.postalCode ?? ""}|${num}`;
}

/**
 * Applique les filtres sur un lot déjà borné au rayon. Renvoie aussi les
 * « facettes » d'activités (compteurs globaux du rayon, indépendants des filtres)
 * pour que la liste des activités garde toujours ses nombres.
 */
function selectBusinesses(
  q: GeoQuery,
  rows: Business[],
  category: string,
  activity: string | undefined,
  matchesSearch: (b: Business) => boolean,
): { items: Business[]; total: number; facets: Record<string, number> } {
  const all = withDistance(q, rows);
  // Fusionne les doublons OSM/BCE : on garde la fiche la plus complète (celle
  // qui porte un n° BCE) pour ne pas afficher deux fois le même commerce.
  const byKey = new Map<string, (typeof all)[number]>();
  for (const b of all) {
    const k = dedupKey(b);
    const prev = byKey.get(k);
    if (
      !prev ||
      rankOf(b) > rankOf(prev) ||
      (rankOf(b) === rankOf(prev) && !prev.bce && b.bce)
    ) {
      byKey.set(k, b);
    }
  }
  const unique = [...byKey.values()];
  const facets: Record<string, number> = {};
  for (const b of unique) {
    const key = activityKey(b.subcategory);
    if (key) facets[key] = (facets[key] ?? 0) + 1;
  }
  const matched = unique
    .filter(
      (b) =>
        (category === "all" || b.category === category) &&
        (!activity || activityKey(b.subcategory) === activity) &&
        matchesSearch(b),
    )
    .sort(byTierThenDistance);
  return { items: matched.slice(0, MAX_BUSINESS_RESULTS), total: matched.length, facets };
}

export async function listBusinesses(
  q: GeoQuery,
  category: string,
  search?: string,
  activity?: string,
): Promise<{ items: Business[]; demo: boolean; total: number; facets: Record<string, number> }> {
  const box = boundingBox(q.lat, q.lng, q.radius);
  // Recherche texte côté serveur : indispensable avec 275 000 fiches, la
  // limite de 300 résultats les plus proches masquait les fiches plus loin.
  const needle = search?.trim().toLowerCase();
  const digits = needle?.replace(/\D/g, "") ?? "";
  const matchesSearch = (b: Business) =>
    !needle ||
    b.name.toLowerCase().includes(needle) ||
    b.town.toLowerCase().includes(needle) ||
    b.address.toLowerCase().includes(needle) ||
    (digits.length > 0 && (b.bce ?? "").replace(/\D/g, "").includes(digits));
  const conn = getDB();
  if (conn) {
    const args = [box.minLat, box.maxLat, box.minLng, box.maxLng];
    let results: Business[] = [];
    try {
      results = (
        await conn
          .prepare(
            `SELECT id, name, category, subcategory, tier, description, address, town,
                    postal_code AS postalCode, lat, lng, phone, website, hours, bce, news,
                    paid_until AS paidUntil, prime
             FROM businesses
             WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?`,
          )
          .bind(...args)
          .all<Business>()
      ).results;
    } catch {
      // migrations pas encore appliquées : requête sans les colonnes récentes
      try {
        results = (
          await conn
            .prepare(
              `SELECT id, name, category, tier, description, address, town,
                      postal_code AS postalCode, lat, lng, phone, website, hours, bce, news
               FROM businesses
               WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?`,
            )
            .bind(...args)
            .all<Business>()
        ).results;
      } catch {
        results = [];
      }
    }
    if (results.length > 0) {
      return { ...selectBusinesses(q, results, category, activity, matchesSearch), demo: false };
    }
  }
  return { ...selectBusinesses(q, BUSINESSES, category, activity, matchesSearch), demo: true };
}

export async function listDealsAndEvents(
  q: GeoQuery,
): Promise<{ deals: Deal[]; events: AgendaEvent[]; demo: boolean }> {
  const box = boundingBox(q.lat, q.lng, q.radius);
  const conn = getDB();
  if (conn) {
    try {
      const dealsRes = await conn
        .prepare(
          `SELECT id, business_id AS businessId, business_name AS businessName, category, title,
                  description, price, original_price AS originalPrice, quantity, remaining,
                  pickup, town, lat, lng, expires_at AS expiresAt
           FROM deals
           WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?`,
        )
        .bind(box.minLat, box.maxLat, box.minLng, box.maxLng)
        .all<Deal>();
      const eventsRes = await conn
        .prepare(
          `SELECT id, title, organizer, type, date, location, town, lat, lng
           FROM events
           WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
             AND hidden = 0
           ORDER BY date ASC
           LIMIT 200`,
        )
        .bind(box.minLat, box.maxLat, box.minLng, box.maxLng)
        .all<AgendaEvent>();
      if (dealsRes.results.length > 0 || eventsRes.results.length > 0) {
        const deals = withDistance(q, dealsRes.results).sort(
          (a, b) => a.remaining - b.remaining || (a.distanceKm ?? 0) - (b.distanceKm ?? 0),
        );
        const events = withDistance(q, eventsRes.results).sort((a, b) =>
          a.date.localeCompare(b.date),
        );
        return { deals, events, demo: false };
      }
    } catch {
      // repli sur les données de démonstration
    }
  }
  const deals = withDistance(q, DEALS).sort(
    (a, b) => a.remaining - b.remaining || (a.distanceKm ?? 0) - (b.distanceKm ?? 0),
  );
  const events = withDistance(q, EVENTS).sort((a, b) => a.date.localeCompare(b.date));
  return { deals, events, demo: true };
}

export async function listNeeds(q: GeoQuery): Promise<{ items: Need[]; demo: boolean }> {
  const box = boundingBox(q.lat, q.lng, q.radius);
  const conn = getDB();
  if (conn) {
    try {
      const { results } = await conn
        .prepare(
          `SELECT id, title, description, kind, artisan_category AS artisanCategory, author,
                  town, lat, lng, status, created_at AS createdAt
           FROM needs
           WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
             AND hidden = 0
           ORDER BY created_at DESC
           LIMIT 200`,
        )
        .bind(box.minLat, box.maxLat, box.minLng, box.maxLng)
        .all<Need>();
      if (results.length > 0) {
        return { items: withDistance(q, results), demo: false };
      }
    } catch {
      // repli sur les données de démonstration
    }
  }
  const items = withDistance(q, NEEDS).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { items, demo: true };
}

export async function listTools(
  q: GeoQuery,
  search: string,
): Promise<{ items: Tool[]; demo: boolean }> {
  const box = boundingBox(q.lat, q.lng, q.radius);
  const needle = `%${search.toLowerCase()}%`;
  const conn = getDB();
  if (conn) {
    try {
      const { results } = await conn
        .prepare(
          `SELECT id, name, description, owner, town, lat, lng, available
           FROM tools
           WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
             AND hidden = 0
             AND (lower(name) LIKE ? OR lower(description) LIKE ? OR lower(owner) LIKE ?)
           LIMIT 200`,
        )
        .bind(box.minLat, box.maxLat, box.minLng, box.maxLng, needle, needle, needle)
        .all<Tool>();
      if (results.length > 0) {
        const items = withDistance(q, results).map((t) => ({
          ...t,
          available: Boolean(t.available),
        }));
        return { items, demo: false };
      }
    } catch {
      // repli sur les données de démonstration
    }
  }
  const s = normalizeText(search.trim());
  const items = withDistance(q, TOOLS)
    .filter(
      (t) =>
        !s ||
        normalizeText(t.name).includes(s) ||
        normalizeText(t.description).includes(s) ||
        normalizeText(t.owner).includes(s),
    )
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  return { items, demo: true };
}

export interface NewNeed {
  title: string;
  description: string;
  kind: "entraide" | "artisan";
  artisanCategory?: string;
  author: string;
  town: string;
  lat: number;
  lng: number;
}

export async function createNeed(
  input: NewNeed,
): Promise<{ need: Need; ownerToken: string; demo: boolean }> {
  const need: Need = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    kind: input.kind,
    artisanCategory: input.artisanCategory,
    author: input.author,
    town: input.town,
    lat: input.lat,
    lng: input.lng,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  // Jeton de propriété : seul l'auteur (qui le conserve en localStorage) peut
  // supprimer sa publication. Il n'est jamais renvoyé par les routes de liste.
  const ownerToken = crypto.randomUUID();
  const conn = getDB();
  if (conn) {
    try {
      await conn
        .prepare(
          `INSERT INTO needs (id, title, description, kind, artisan_category, author, town, lat, lng, status, owner_token, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
        )
        .bind(
          need.id,
          need.title,
          need.description,
          need.kind,
          need.artisanCategory ?? null,
          need.author,
          need.town,
          need.lat,
          need.lng,
          ownerToken,
          need.createdAt,
        )
        .run();
      return { need, ownerToken, demo: false };
    } catch {
      // mode démo
    }
  }
  return { need, ownerToken, demo: true };
}

function makePickupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `VC-${code}`;
}

export async function createReservation(input: {
  dealId: string;
  name: string;
  phone?: string;
}): Promise<{ code: string; demo: boolean } | { error: "soldout"; demo: boolean }> {
  const code = makePickupCode();
  const conn = getDB();
  if (conn) {
    try {
      // Décrément conditionnel : on ne réserve que s'il reste un panier.
      // `meta.changes === 0` signale l'épuisement (y compris en cas de course).
      const dec = await conn
        .prepare(`UPDATE deals SET remaining = remaining - 1 WHERE id = ? AND remaining > 0`)
        .bind(input.dealId)
        .run();
      if (!dec.meta?.changes) {
        return { error: "soldout", demo: false };
      }
      await conn
        .prepare(
          `INSERT INTO reservations (id, deal_id, name, phone, code, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(crypto.randomUUID(), input.dealId, input.name, input.phone ?? null, code, new Date().toISOString())
        .run();
      return { code, demo: false };
    } catch {
      // mode démo
    }
  }
  return { code, demo: true };
}

export async function createClaim(input: {
  businessId: string;
  name: string;
  email: string;
  phone?: string;
  bce?: string;
  message?: string;
}): Promise<{ ok: boolean; demo: boolean }> {
  const conn = getDB();
  if (conn) {
    try {
      // Une seule revendication en attente par fiche : les doubles clics et
      // rechargements ne créent pas de doublon dans la console admin.
      const existing = await conn
        .prepare(`SELECT id FROM claims WHERE business_id = ? LIMIT 1`)
        .bind(input.businessId)
        .first<{ id: string }>();
      if (existing) return { ok: true, demo: false };
      await conn
        .prepare(
          `INSERT INTO claims (id, business_id, name, email, phone, bce, message, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          input.businessId,
          input.name,
          input.email,
          input.phone ?? null,
          input.bce ?? null,
          input.message ?? null,
          new Date().toISOString(),
        )
        .run();
      return { ok: true, demo: false };
    } catch {
      // mode démo
    }
  }
  return { ok: true, demo: true };
}

export async function createLoanRequest(input: {
  toolId: string;
  requester: string;
  dates?: string;
  message?: string;
}): Promise<{ ok: boolean; demo: boolean }> {
  const conn = getDB();
  if (conn) {
    try {
      await conn
        .prepare(
          `INSERT INTO loan_requests (id, tool_id, requester, dates, message, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          input.toolId,
          input.requester,
          input.dates ?? null,
          input.message ?? null,
          new Date().toISOString(),
        )
        .run();
      return { ok: true, demo: false };
    } catch {
      // mode démo
    }
  }
  return { ok: true, demo: true };
}

export interface AdminClaim {
  id: string;
  businessId: string;
  businessName: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  createdAt: string;
}

function getAdminToken(): string | null {
  try {
    const { env } = getCloudflareContext();
    return env.ADMIN_TOKEN ?? null;
  } catch {
    return null;
  }
}

export function isAdmin(token: string | null | undefined): boolean {
  const expected = getAdminToken();
  return Boolean(expected && token && token === expected);
}

export async function listClaims(): Promise<AdminClaim[]> {
  const conn = getDB();
  if (!conn) return [];
  const query = (bce: boolean) =>
    `SELECT c.id, c.business_id AS businessId, b.name AS businessName, c.name,
            c.email, c.phone, ${bce ? "c.bce" : "NULL AS bce"}, c.message, c.created_at AS createdAt
     FROM claims c LEFT JOIN businesses b ON b.id = c.business_id
     ORDER BY c.created_at DESC LIMIT 200`;
  try {
    return (await conn.prepare(query(true)).all<AdminClaim>()).results ?? [];
  } catch {
    try {
      return (await conn.prepare(query(false)).all<AdminClaim>()).results ?? [];
    } catch {
      return [];
    }
  }
}

export async function deleteClaimsForBusiness(businessId: string): Promise<boolean> {
  const conn = getDB();
  if (!conn) return false;
  await conn.prepare(`DELETE FROM claims WHERE business_id = ?`).bind(businessId).run();
  return true;
}

export async function deleteClaim(id: string): Promise<boolean> {
  const conn = getDB();
  if (!conn) return false;
  await conn.prepare(`DELETE FROM claims WHERE id = ?`).bind(id).run();
  return true;
}

export async function adminSearchBusinesses(q: string): Promise<Business[]> {
  const conn = getDB();
  if (!conn) return [];
  const like = `%${q}%`;
  const digits = q.replace(/\D/g, "");
  const hasDigits = digits.length > 0;
  const digitsLike = `%${digits}%`;
  const query = (full: boolean) =>
    `SELECT id, name, category, ${full ? "subcategory, " : ""}tier, description, address, town,
            postal_code AS postalCode, lat, lng, phone, website, hours, bce, news,
            ${full ? "paid_until AS paidUntil, prime" : "'' AS paidUntil, 0 AS prime"}
     FROM businesses
     WHERE (name LIKE ?1 OR town LIKE ?1 OR address LIKE ?1${hasDigits ? " OR replace(bce, '.', '') LIKE ?2" : ""})
     ORDER BY name LIMIT 100`;
  const run = async (sql: string) => {
    const stmt = conn.prepare(sql);
    const res = hasDigits ? await stmt.bind(like, digitsLike).all<Business>() : await stmt.bind(like).all<Business>();
    return res.results ?? [];
  };
  try {
    return await run(query(true));
  } catch {
    try {
      return await run(query(false));
    } catch {
      return [];
    }
  }
}

export async function setBusinessTier(
  id: string,
  tier: BusinessTier,
  paidUntil?: string | null,
): Promise<boolean> {
  const conn = getDB();
  if (!conn) return false;
  await conn
    .prepare(`UPDATE businesses SET tier = ?, paid_until = ? WHERE id = ?`)
    .bind(tier, paidUntil ?? null, id)
    .run();
  return true;
}

export async function setBusinessPrime(id: string, prime: boolean): Promise<boolean> {
  const conn = getDB();
  if (!conn) return false;
  await conn
    .prepare(`UPDATE businesses SET prime = ? WHERE id = ?`)
    .bind(prime ? 1 : 0, id)
    .run();
  return true;
}

export async function updateBusinessDetails(
  id: string,
  patch: {
    name?: string | null;
    category?: string | null;
    subcategory?: string | null;
    address?: string | null;
    town?: string | null;
    postalCode?: string | null;
    description?: string | null;
    phone?: string | null;
    website?: string | null;
    hours?: string | null;
    news?: string | null;
  },
): Promise<boolean> {
  const conn = getDB();
  if (!conn) return false;
  await conn
    .prepare(
      `UPDATE businesses SET
         name = COALESCE(?, name),
         category = COALESCE(?, category),
         subcategory = COALESCE(?, subcategory),
         address = COALESCE(?, address),
         town = COALESCE(?, town),
         postal_code = COALESCE(?, postal_code),
         description = COALESCE(?, description),
         phone = COALESCE(?, phone),
         website = COALESCE(?, website),
         hours = COALESCE(?, hours),
         news = COALESCE(?, news)
       WHERE id = ?`,
    )
    .bind(
      patch.name ?? null,
      patch.category ?? null,
      patch.subcategory ?? null,
      patch.address ?? null,
      patch.town ?? null,
      patch.postalCode ?? null,
      patch.description ?? null,
      patch.phone ?? null,
      patch.website ?? null,
      patch.hours ?? null,
      patch.news ?? null,
      id,
    )
    .run();
  return true;
}

export async function listSubscriptions(): Promise<Business[]> {
  const conn = getDB();
  if (!conn) return [];
  try {
    return (
      await conn
        .prepare(
          `SELECT id, name, category, subcategory, tier, description, address, town,
                  postal_code AS postalCode, lat, lng, phone, website, hours, bce, news,
                  paid_until AS paidUntil, prime
           FROM businesses
           WHERE tier != 'standard'
           ORDER BY prime DESC, paid_until ASC NULLS LAST LIMIT 100`,
        )
        .all<Business>()
    ).results ?? [];
  } catch {
    try {
      return (
        await conn
          .prepare(
            `SELECT id, name, category, tier, description, address, town,
                    postal_code AS postalCode, lat, lng, phone, website, hours, bce, news,
                    0 AS prime
             FROM businesses
             WHERE tier != 'standard'
             LIMIT 100`,
          )
          .all<Business>()
      ).results ?? [];
    } catch {
      return [];
    }
  }
}

export interface NewEvent {
  title: string;
  organizer: string;
  type: string;
  date: string;
  location: string;
  town: string;
  lat: number;
  lng: number;
}

export async function createEvent(
  input: NewEvent,
): Promise<{ event: AgendaEvent; ownerToken: string; demo: boolean }> {
  const event: AgendaEvent = {
    id: crypto.randomUUID(),
    title: input.title,
    organizer: input.organizer,
    type: input.type,
    date: input.date,
    location: input.location,
    town: input.town,
    lat: input.lat,
    lng: input.lng,
  };
  const ownerToken = crypto.randomUUID();
  const conn = getDB();
  if (conn) {
    try {
      await conn
        .prepare(
          `INSERT INTO events (id, title, organizer, type, date, location, town, lat, lng, owner_token)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          event.id,
          event.title,
          event.organizer,
          event.type,
          event.date,
          event.location,
          event.town,
          event.lat,
          event.lng,
          ownerToken,
        )
        .run();
      return { event, ownerToken, demo: false };
    } catch {
      // mode démo
    }
  }
  return { event, ownerToken, demo: true };
}

export type DeleteResult = "ok" | "forbidden" | "unavailable";

export async function deleteRow(
  table: "needs" | "tools" | "events" | "deals",
  id: string,
  ownerToken?: string | null,
): Promise<DeleteResult> {
  const conn = getDB();
  if (!conn) return "unavailable";
  // Pour les tables communautaires, on exige le jeton de propriété.
  if (table === "needs" || table === "tools" || table === "events") {
    if (!ownerToken) return "forbidden";
    const res = await conn
      .prepare(`DELETE FROM ${table} WHERE id = ? AND owner_token = ?`)
      .bind(id, ownerToken)
      .run();
    return res.meta?.changes ? "ok" : "forbidden";
  }
  await conn.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  return "ok";
}

export async function setContentHidden(
  table: "needs" | "tools" | "events",
  id: string,
  hidden: boolean,
): Promise<boolean> {
  const conn = getDB();
  if (!conn) return false;
  await conn.prepare(`UPDATE ${table} SET hidden = ? WHERE id = ?`).bind(hidden ? 1 : 0, id).run();
  return true;
}

export interface Report {
  id: string;
  contentType: "need" | "event" | "tool";
  contentId: string;
  reason: string;
  createdAt: string;
}

export async function createReport(input: {
  contentType: "need" | "event" | "tool";
  contentId: string;
  reason?: string;
}): Promise<{ ok: boolean; demo: boolean }> {
  const conn = getDB();
  if (conn) {
    try {
      await conn
        .prepare(
          `INSERT INTO reports (id, content_type, content_id, reason, created_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(crypto.randomUUID(), input.contentType, input.contentId, input.reason ?? "", new Date().toISOString())
        .run();
      return { ok: true, demo: false };
    } catch {
      // mode démo
    }
  }
  return { ok: true, demo: true };
}

export async function listReports(): Promise<Report[]> {
  const conn = getDB();
  if (!conn) return [];
  try {
    const { results } = await conn
      .prepare(
        `SELECT id, content_type AS contentType, content_id AS contentId, reason, created_at AS createdAt
         FROM reports
         ORDER BY created_at DESC
         LIMIT 200`,
      )
      .all<Report>();
    return results ?? [];
  } catch {
    return [];
  }
}

export async function takeNeed(id: string): Promise<boolean> {
  const conn = getDB();
  if (!conn) return false;
  await conn.prepare(`UPDATE needs SET status = 'taken' WHERE id = ?`).bind(id).run();
  return true;
}

export interface NewTool {
  name: string;
  description: string;
  owner: string;
  town: string;
  lat: number;
  lng: number;
}

export async function createTool(input: NewTool): Promise<{ tool: Tool; ownerToken: string; demo: boolean }> {
  const tool: Tool = {
    id: crypto.randomUUID(),
    name: input.name,
    description: input.description,
    owner: input.owner,
    town: input.town,
    lat: input.lat,
    lng: input.lng,
    available: true,
  };
  const ownerToken = crypto.randomUUID();
  const conn = getDB();
  if (conn) {
    try {
      await conn
        .prepare(
          `INSERT INTO tools (id, name, description, owner, town, lat, lng, available, owner_token)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        )
        .bind(tool.id, tool.name, tool.description, tool.owner, tool.town, tool.lat, tool.lng, ownerToken)
        .run();
      return { tool, ownerToken, demo: false };
    } catch {
      // mode démo
    }
  }
  return { tool, ownerToken, demo: true };
}

export interface NewBusiness {
  name: string;
  category: BusinessCategory;
  subcategory?: string;
  description?: string;
  address: string;
  town: string;
  postalCode: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  hours?: string;
  bce?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
}

/**
 * Ajout d'un commerce par son gérant (libre-service). La fiche est créée en
 * « standard » et immédiatement auto-revendiquée (une demande de vérification
 * est déposée dans la console admin), pour que le gérant n'ait pas à recliquer
 * « Revendiquer ». On ne la passe pas d'office en « Vérifiée » (anti-abus).
 */
export async function createBusiness(
  input: NewBusiness,
): Promise<{ business: Business; demo: boolean; existing: boolean }> {
  const conn0 = getDB();
  if (conn0) {
    // Anti-doublon : si une fiche (OSM/BCE/utilisateur) existe déjà pour ce nom
    // dans cette localité, on ne crée rien — le gérant doit revendiquer la
    // fiche existante plutôt que d'en dupliquer une.
    const normName = input.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const candidates = await conn0
      .prepare(`SELECT id, name FROM businesses WHERE town = ?`)
      .bind(input.town)
      .all<{ id: string; name: string }>();
    const dup = (candidates.results ?? []).find(
      (r) =>
        r.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "") === normName,
    );
    if (dup) {
      const existing = await conn0
        .prepare(
          `SELECT id, name, category, subcategory, tier, description, address, town, postal_code AS postalCode,
                  lat, lng, phone, website, hours, bce, news,
                  paid_until AS paidUntil, 0 AS prime
           FROM businesses WHERE id = ? LIMIT 1`,
        )
        .bind(dup.id)
        .first<Business>();
      if (existing) return { business: existing, demo: false, existing: true };
    }
  }
  const business: Business = {
    id: `user-${crypto.randomUUID()}`,
    name: input.name,
    category: input.category,
    subcategory: input.subcategory,
    tier: "standard",
    description: input.description || "Commerce de proximité ajouté par son gérant.",
    address: input.address,
    town: input.town,
    postalCode: input.postalCode,
    lat: input.lat,
    lng: input.lng,
    phone: input.phone,
    website: input.website,
    hours: input.hours,
    bce: input.bce,
  };
  const conn = getDB();
  if (conn) {
    try {
      await conn
        .prepare(
          `INSERT INTO businesses (id, name, category, subcategory, tier, description, address, town, postal_code, lat, lng, phone, website, hours, bce, news)
           VALUES (?, ?, ?, ?, 'standard', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        )
        .bind(
          business.id,
          business.name,
          business.category,
          business.subcategory ?? "",
          business.description,
          business.address,
          business.town,
          business.postalCode,
          business.lat,
          business.lng,
          business.phone ?? null,
          business.website ?? null,
          business.hours ?? null,
          business.bce ?? null,
        )
        .run();
      await conn
        .prepare(
          `INSERT INTO claims (id, business_id, name, email, phone, bce, message, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          business.id,
          input.contactName,
          input.contactEmail,
          input.contactPhone ?? null,
          business.bce ?? null,
          "Fiche créée par le gérant (auto-revendiquée).",
          new Date().toISOString(),
        )
        .run();
      return { business, demo: false, existing: false };
    } catch {
      // mode démo
    }
  }
  return { business, demo: true, existing: false };
}

export interface NewDeal {
  businessId: string;
  businessName: string;
  category: BusinessCategory;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  remaining: number;
  pickup: string;
  town: string;
  lat: number;
  lng: number;
  expiresAt: string;
}

/**
 * Ajout d'un bon plan par le gestionnaire (à partir d'un e-mail fournisseur).
 * L'admin colle l'offre reçue : elle apparaît dans le fil des voisins du rayon.
 */
export async function createDeal(input: NewDeal): Promise<{ deal: Deal; demo: boolean }> {
  const deal: Deal = { id: `deal-${crypto.randomUUID()}`, ...input };
  const conn = getDB();
  if (conn) {
    try {
      await conn
        .prepare(
          `INSERT INTO deals (id, business_id, business_name, category, title, description, price, original_price, quantity, remaining, pickup, town, lat, lng, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          deal.id,
          deal.businessId,
          deal.businessName,
          deal.category,
          deal.title,
          deal.description,
          deal.price,
          deal.originalPrice ?? null,
          deal.quantity,
          deal.remaining,
          deal.pickup,
          deal.town,
          deal.lat,
          deal.lng,
          deal.expiresAt,
        )
        .run();
      return { deal, demo: false };
    } catch {
      // mode démo
    }
  }
  return { deal, demo: true };
}

export async function listAllDeals(): Promise<Deal[]> {
  const conn = getDB();
  if (!conn) return [];
  try {
    const { results } = await conn
      .prepare(
        `SELECT id, business_id AS businessId, business_name AS businessName, category, title,
                description, price, original_price AS originalPrice, quantity, remaining,
                pickup, town, lat, lng, expires_at AS expiresAt
         FROM deals
         ORDER BY expires_at ASC
         LIMIT 200`,
      )
      .all<Deal>();
    return results ?? [];
  } catch {
    return [];
  }
}

export async function deleteDeal(id: string): Promise<boolean> {
  const conn = getDB();
  if (!conn) return false;
  await conn.prepare(`DELETE FROM deals WHERE id = ?`).bind(id).run();
  return true;
}
