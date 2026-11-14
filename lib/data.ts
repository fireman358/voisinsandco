import { getCloudflareContext } from "@opennextjs/cloudflare";
import { boundingBox, haversineKm } from "./geo";
import { BUSINESSES, DEALS, DEFAULT_BASE, EVENTS, NEEDS, TOOLS } from "./seed";
import type { AgendaEvent, Business, BusinessTier, Deal, Need, Tool } from "./types";
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
    radius: VALID_RADII.includes(radius) ? radius : 10,
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

function byProThenDistance(a: Business, b: Business): number {
  const proA = a.tier === "pro" ? 0 : 1;
  const proB = b.tier === "pro" ? 0 : 1;
  return proA - proB || (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
}

export async function listBusinesses(
  q: GeoQuery,
  category: string,
): Promise<{ items: Business[]; demo: boolean }> {
  const box = boundingBox(q.lat, q.lng, q.radius);
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
                    paid_until AS paidUntil
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
      const items = withDistance(q, results)
        .filter((b) => category === "all" || b.category === category)
        .sort(byProThenDistance);
      return { items, demo: false };
    }
  }
  const items = withDistance(q, BUSINESSES)
    .filter((b) => category === "all" || b.category === category)
    .sort(byProThenDistance);
  return { items, demo: true };
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
           ORDER BY date ASC`,
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
           ORDER BY created_at DESC`,
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
             AND (lower(name) LIKE ? OR lower(description) LIKE ? OR lower(owner) LIKE ?)`,
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

export async function createNeed(input: NewNeed): Promise<{ need: Need; demo: boolean }> {
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
  const conn = getDB();
  if (conn) {
    try {
      await conn
        .prepare(
          `INSERT INTO needs (id, title, description, kind, artisan_category, author, town, lat, lng, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
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
          need.createdAt,
        )
        .run();
      return { need, demo: false };
    } catch {
      // mode démo
    }
  }
  return { need, demo: true };
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
}): Promise<{ code: string; demo: boolean }> {
  const code = makePickupCode();
  const conn = getDB();
  if (conn) {
    try {
      await conn
        .prepare(
          `INSERT INTO reservations (id, deal_id, name, phone, code, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(crypto.randomUUID(), input.dealId, input.name, input.phone ?? null, code, new Date().toISOString())
        .run();
      await conn
        .prepare(`UPDATE deals SET remaining = MAX(0, remaining - 1) WHERE id = ?`)
        .bind(input.dealId)
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

export async function adminSearchBusinesses(q: string): Promise<Business[]> {
  const conn = getDB();
  if (!conn) return [];
  const like = `%${q}%`;
  const query = (full: boolean) =>
    `SELECT id, name, category, ${full ? "subcategory, " : ""}tier, description, address, town,
            postal_code AS postalCode, lat, lng, phone, website, hours, bce, news,
            ${full ? "paid_until AS paidUntil" : "'' AS paidUntil"}
     FROM businesses
     WHERE name LIKE ?1 OR town LIKE ?1
     ORDER BY name LIMIT 50`;
  try {
    return (await conn.prepare(query(true)).bind(like).all<Business>()).results ?? [];
  } catch {
    try {
      return (await conn.prepare(query(false)).bind(like).all<Business>()).results ?? [];
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

export async function listSubscriptions(): Promise<Business[]> {
  const conn = getDB();
  if (!conn) return [];
  try {
    return (
      await conn
        .prepare(
          `SELECT id, name, category, subcategory, tier, description, address, town,
                  postal_code AS postalCode, lat, lng, phone, website, hours, bce, news,
                  paid_until AS paidUntil
           FROM businesses
           WHERE tier != 'standard'
           ORDER BY paid_until ASC NULLS LAST LIMIT 100`,
        )
        .all<Business>()
    ).results ?? [];
  } catch {
    try {
      return (
        await conn
          .prepare(
            `SELECT id, name, category, tier, description, address, town,
                    postal_code AS postalCode, lat, lng, phone, website, hours, bce, news
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

export async function createEvent(input: NewEvent): Promise<{ event: AgendaEvent; demo: boolean }> {
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
  const conn = getDB();
  if (conn) {
    try {
      await conn
        .prepare(
          `INSERT INTO events (id, title, organizer, type, date, location, town, lat, lng)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        )
        .run();
      return { event, demo: false };
    } catch {
      // mode démo
    }
  }
  return { event, demo: true };
}

export async function deleteRow(table: "needs" | "tools" | "events" | "deals", id: string): Promise<boolean> {
  const conn = getDB();
  if (!conn) return false;
  await conn.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  return true;
}
