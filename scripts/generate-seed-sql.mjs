import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "lib", "seed-data.json"), "utf8"));

const q = (v) => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  return `'${String(v).replace(/'/g, "''")}'`;
};

const lines = [];
lines.push("-- Seed Voisins & Co (sociétés réelles OpenStreetMap — Wallonie)");
lines.push("-- Généré depuis lib/seed-data.json — ne pas éditer à la main.");
lines.push("-- Exécuté à chaque déploiement (wrangler d1 execute) : purge puis re-seed.");
lines.push("");
lines.push("DELETE FROM businesses;");
lines.push("DELETE FROM deals;");
lines.push("DELETE FROM events;");
lines.push("DELETE FROM needs;");
lines.push("DELETE FROM tools;");
lines.push("");

for (const b of data.businesses) {
  lines.push(
    `INSERT OR REPLACE INTO businesses (id, name, category, tier, description, address, town, postal_code, lat, lng, phone, website, hours, bce, news) VALUES (${[
      q(b.id), q(b.name), q(b.category), q(b.tier), q(b.description), q(b.address), q(b.town),
      q(b.postalCode), q(b.lat), q(b.lng), q(b.phone ?? null), q(b.website ?? null),
      q(b.hours ?? null), q(b.bce ?? null), q(b.news ?? null),
    ].join(", ")});`,
  );
}
lines.push("");
for (const d of data.deals) {
  lines.push(
    `INSERT OR REPLACE INTO deals (id, business_id, business_name, category, title, description, price, original_price, quantity, remaining, pickup, town, lat, lng, expires_at) VALUES (${[
      q(d.id), q(d.businessId), q(d.businessName), q(d.category), q(d.title), q(d.description),
      q(d.price), q(d.originalPrice ?? null), q(d.quantity), q(d.remaining), q(d.pickup), q(d.town),
      q(d.lat), q(d.lng), `datetime('now', '+${d.expiresOffsetHours} hours')`,
    ].join(", ")});`,
  );
}
lines.push("");
for (const e of data.events) {
  lines.push(
    `INSERT OR REPLACE INTO events (id, title, organizer, type, date, location, town, lat, lng) VALUES (${[
      q(e.id), q(e.title), q(e.organizer), q(e.type), `datetime('now', '+${e.dateOffsetDays} days')`,
      q(e.location), q(e.town), q(e.lat), q(e.lng),
    ].join(", ")});`,
  );
}
lines.push("");
for (const n of data.needs) {
  lines.push(
    `INSERT OR REPLACE INTO needs (id, title, description, kind, artisan_category, author, town, lat, lng, status, created_at) VALUES (${[
      q(n.id), q(n.title), q(n.description), q(n.kind), q(n.artisanCategory ?? null), q(n.author),
      q(n.town), q(n.lat), q(n.lng), q("open"), `datetime('now', '-${n.createdOffsetHours} hours')`,
    ].join(", ")});`,
  );
}
lines.push("");
for (const t of data.tools) {
  lines.push(
    `INSERT OR REPLACE INTO tools (id, name, description, owner, town, lat, lng, available) VALUES (${[
      q(t.id), q(t.name), q(t.description), q(t.owner), q(t.town), q(t.lat), q(t.lng), q(t.available),
    ].join(", ")});`,
  );
}
lines.push("");

const sql = lines.join("\n");
fs.writeFileSync(path.join(root, "seed.sql"), sql);
console.log(`OK seed.sql (${(sql.length / 1e6).toFixed(1)} Mo)`);
