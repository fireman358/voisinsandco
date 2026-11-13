import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const BBOX = [50.46, 4.24, 50.64, 4.42];

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.osm.jp/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const QUERY = `[out:json][timeout:90];
(
  nwr["shop"]["name"](${BBOX.join(",")});
  nwr["craft"]["name"](${BBOX.join(",")});
  nwr["amenity"~"^(restaurant|fast_food|cafe|bar|pub|ice_cream|pharmacy|doctors|dentist|veterinary|hairdresser|car_repair|fuel|vending_machine|atm|bank)$"]["name"](${BBOX.join(",")});
);
out center tags;`;

const ALIMENTATION_SHOPS = new Set([
  "bakery", "butcher", "supermarket", "convenience", "greengrocer", "farm", "cheese",
  "dairy", "deli", "seafood", "chocolate", "alcohol", "beverages", "wine", "tea",
  "coffee", "frozen_food", "pasta", "spices", "pastry", "confectionery", "nutrition",
]);
const HORECA_AMENITIES = new Set(["restaurant", "fast_food", "cafe", "bar", "pub", "ice_cream"]);
const DISTRIBUTEUR_AMENITIES = new Set(["fuel", "vending_machine", "atm"]);
const ARTISAN_AMENITIES = new Set([
  "pharmacy", "doctors", "dentist", "veterinary", "hairdresser", "car_repair", "bank",
]);

const CATEGORY_DESCRIPTIONS = {
  alimentation: "Alimentation et produits frais, repérés sur OpenStreetMap.",
  horeca: "Table et terrasse du quartier, repérée sur OpenStreetMap.",
  artisan: "Artisan ou service de proximité, repéré sur OpenStreetMap.",
  distributeur: "Distributeur et services 24/7, repérés sur OpenStreetMap.",
};

const TOWNS = [
  { name: "Arquennes", postalCode: "7181", lat: 50.5045, lng: 4.3695 },
  { name: "Seneffe", postalCode: "7180", lat: 50.5293, lng: 4.2706 },
  { name: "Feluy", postalCode: "7181", lat: 50.5417, lng: 4.2419 },
  { name: "Nivelles", postalCode: "1400", lat: 50.5975, lng: 4.3258 },
  { name: "Baulers", postalCode: "1401", lat: 50.6117, lng: 4.3056 },
];

function categoryFor(tags) {
  if (tags.shop && ALIMENTATION_SHOPS.has(tags.shop)) return "alimentation";
  if (tags.amenity && HORECA_AMENITIES.has(tags.amenity)) return "horeca";
  if (tags.amenity && DISTRIBUTEUR_AMENITIES.has(tags.amenity)) return "distributeur";
  if (tags.craft || (tags.amenity && ARTISAN_AMENITIES.has(tags.amenity))) return "artisan";
  if (tags.shop && ["hairdresser", "beauty", "florist", "hardware", "bakery"].includes(tags.shop)) {
    return "artisan";
  }
  return null;
}

function nearestTown(lat, lng) {
  let best = TOWNS[0];
  let bestD = Infinity;
  for (const t of TOWNS) {
    const d = (t.lat - lat) ** 2 + ((t.lng - lng) * 0.65) ** 2;
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}

function slug(id, name) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `osm-${id}-${base || "poi"}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function tryEndpoint(endpoint) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "voisinsandco-osm-import/1.0 (https://github.com/fireman358/voisinsandco)",
        },
        body: `data=${encodeURIComponent(QUERY)}`,
        signal: AbortSignal.timeout(120_000),
      });
      if (res.status === 429 || res.status === 504) {
        console.warn(`Échec ${endpoint} : HTTP ${res.status} (tentative ${attempt}/3)`);
        await sleep(20_000 * attempt);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.elements) return json.elements;
      throw new Error("réponse Overpass sans éléments");
    } catch (err) {
      if (err.name === "TimeoutError" || attempt === 3) throw err;
      console.warn(`Échec ${endpoint} : ${err.message} (tentative ${attempt}/3)`);
      await sleep(10_000);
    }
  }
  throw new Error("inaccessible");
}

async function fetchOverpass() {
  let lastError;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const elements = await tryEndpoint(endpoint);
      console.log(`OK ${endpoint} : ${elements.length} éléments`);
      return elements;
    } catch (err) {
      lastError = err;
      console.warn(`Échec ${endpoint} : ${err.message}`);
    }
  }
  throw new Error(`Tous les miroirs Overpass ont échoué : ${lastError?.message}`);
}

const elements = await fetchOverpass();

const businesses = [];
const seen = new Set();

for (const el of elements) {
  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lng ?? el.center?.lng;
  const name = tags.name?.trim();
  if (!name || lat === undefined || lng === undefined) continue;

  const category = categoryFor(tags);
  if (!category) continue;

  const key = `${name.toLowerCase()}|${Math.round(lat * 1000)}|${Math.round(lng * 1000)}`;
  if (seen.has(key)) continue;
  seen.add(key);

  const town = tags["addr:city"] ? { name: tags["addr:city"], postalCode: tags["addr:postcode"] ?? nearestTown(lat, lng).postalCode } : nearestTown(lat, lng);
  const address = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || null;

  businesses.push({
    id: slug(el.id, name),
    name,
    category,
    tier: "standard",
    description: CATEGORY_DESCRIPTIONS[category],
    address: address ?? "Adresse à compléter",
    town: town.name,
    postalCode: town.postalCode,
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
    ...(tags.phone || tags["contact:phone"] || tags["contact:mobile"]
      ? { phone: tags.phone || tags["contact:phone"] || tags["contact:mobile"] }
      : {}),
    ...(tags.website || tags["contact:website"]
      ? { website: tags.website || tags["contact:website"] }
      : {}),
    ...(tags.opening_hours ? { hours: tags.opening_hours } : {}),
  });
}

businesses.sort((a, b) => a.town.localeCompare(b.town) || a.name.localeCompare(b.name));

const seedPath = path.join(root, "lib", "seed-data.json");
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));

const keptIds = new Set(businesses.map((b) => b.id));
seed.businesses = businesses;
seed.deals = seed.deals.filter((d) => keptIds.has(d.businessId));

fs.writeFileSync(seedPath, `${JSON.stringify(seed, null, 2)}\n`);
console.log(`OK ${businesses.length} sociétés réelles importées d'OpenStreetMap dans lib/seed-data.json`);
