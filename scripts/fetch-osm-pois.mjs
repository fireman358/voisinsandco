import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.osm.jp/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

// Boîte englobante de la Wallonie (les communes hors Wallonie récupérées en plus
// ne gênent pas : l'app filtre par rayon autour de l'utilisateur, jamais par
// province — aucune limite pour qui habite près d'une frontière provinciale).
const BBOX = [49.95, 2.9, 50.85, 6.45];

const POI_QUERY = `[out:json][timeout:300];
(
  nwr["shop"]["name"](${BBOX.join(",")});
  nwr["craft"]["name"](${BBOX.join(",")});
  nwr["amenity"~"^(restaurant|fast_food|cafe|bar|pub|ice_cream|pharmacy|doctors|dentist|veterinary|hairdresser|car_repair|fuel|vending_machine|atm|bank)$"]["name"](${BBOX.join(",")});
);
out center tags;`;

// Centroïdes des communes (admin_level=8) pour rattacher chaque POI à sa commune.
const COMMUNES_QUERY = `[out:json][timeout:120];
rel["boundary"="administrative"]["admin_level"="8"](${BBOX.join(",")});
out center tags;`;

const ALIMENTATION_SHOPS = new Set([
  "bakery", "butcher", "supermarket", "convenience", "greengrocer", "farm", "cheese",
  "dairy", "deli", "seafood", "chocolate", "alcohol", "beverages", "wine", "tea",
  "coffee", "frozen_food", "pasta", "spices", "pastry", "confectionery", "nutrition",
]);
const HORECA_AMENITIES = new Set(["restaurant", "fast_food", "cafe", "bar", "pub", "ice_cream"]);
const DISTRIBUTEUR_AMENITIES = new Set(["fuel", "vending_machine", "atm"]);
const ARTISAN_AMENITIES = new Set([
  "pharmacy", "doctors", "dentist", "veterinary", "hairdresser", "car_repair",
]);

const CATEGORY_DESCRIPTIONS = {
  alimentation: "Alimentation et produits frais, repérés sur OpenStreetMap.",
  horeca: "Table et terrasse du quartier, repérée sur OpenStreetMap.",
  artisan: "Artisan ou service de proximité, repéré sur OpenStreetMap.",
  distributeur: "Distributeur et services 24/7, repérés sur OpenStreetMap.",
};

const DEMO_RADIUS_KM = 12;
const DEMO_TOWNS = {
  Arquennes: [50.5033, 4.3667],
  Seneffe: [50.5256, 4.259],
  Feluy: [50.551, 4.27],
  Nivelles: [50.5928, 4.3244],
  Baulers: [50.579, 4.305],
};

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

async function tryEndpoint(endpoint, query) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "voisinsandco-osm-import/1.0 (https://github.com/fireman358/voisinsandco)",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(300_000),
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

async function fetchOverpass(query, label) {
  let lastError;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const elements = await tryEndpoint(endpoint, query);
      console.log(`OK ${label} — ${endpoint} : ${elements.length} éléments`);
      return elements;
    } catch (err) {
      lastError = err;
      console.warn(`Échec ${label} — ${endpoint} : ${err.message}`);
    }
  }
  throw new Error(`Tous les miroirs Overpass ont échoué (${label}) : ${lastError?.message}`);
}

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const poiElements = await fetchOverpass(POI_QUERY, "POI Wallonie");
const communeElements = await fetchOverpass(COMMUNES_QUERY, "communes");
const communes = communeElements
  .filter((e) => e.type === "relation" && e.tags?.name && e.center)
  .map((e) => ({ name: e.tags.name, lat: e.center.lat, lng: e.center.lon }));
console.log(`${communes.length} communes chargées`);
if (communes.length === 0) throw new Error("aucune commune récupérée");

function nearestCommune(lat, lng) {
  let best = null;
  let bestD = Infinity;
  for (const c of communes) {
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best.name;
}

const businesses = [];
const seen = new Set();

for (const el of poiElements) {
  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  const name = tags.name?.trim();
  if (!name || lat === undefined || lon === undefined) continue;

  const category = categoryFor(tags);
  if (!category) continue;

  const town = tags["addr:city"] || nearestCommune(lat, lon);

  const key = `${name.toLowerCase()}|${Math.round(lat * 1000)}|${Math.round(lon * 1000)}`;
  const townKey = `${name.toLowerCase()}|${town.toLowerCase()}`;
  if (seen.has(key) || seen.has(townKey)) continue;
  seen.add(key);
  seen.add(townKey);

  const address = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || null;

  businesses.push({
    id: slug(el.id, name),
    name,
    category,
    subcategory: tags.shop || tags.craft || tags.amenity || "",
    tier: "standard",
    description: CATEGORY_DESCRIPTIONS[category],
    address: address ?? "Adresse à compléter",
    town,
    postalCode: tags["addr:postcode"] ?? "",
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lon * 1e6) / 1e6,
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

// Fallback de démonstration embarqué dans le Worker (bundle léger) :
// uniquement les fiches autour des communes de référence.
const demoBusinesses = businesses.filter((b) =>
  Object.values(DEMO_TOWNS).some(([lat, lng]) => haversineKm(b.lat, b.lng, lat, lng) <= DEMO_RADIUS_KM),
);
const demoIds = new Set(demoBusinesses.map((b) => b.id));
fs.writeFileSync(
  path.join(root, "lib", "demo-data.json"),
  `${JSON.stringify(
    {
      businesses: demoBusinesses,
      deals: seed.deals.filter((d) => demoIds.has(d.businessId)),
      events: seed.events,
      needs: seed.needs,
      tools: seed.tools,
    },
    null,
    2,
  )}\n`,
);

// Liste des communes pour la recherche par ville (géocodage local, sans API externe).
const communesList = [...new Map(communes.map((c) => [c.name, c])).values()]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((c) => ({ name: c.name, lat: Math.round(c.lat * 1e6) / 1e6, lng: Math.round(c.lng * 1e6) / 1e6 }));
fs.writeFileSync(path.join(root, "lib", "communes.json"), `${JSON.stringify(communesList, null, 2)}\n`);

console.log(`OK ${businesses.length} sociétés réelles en Wallonie (dont ${demoBusinesses.length} dans le périmètre de démo)`);
