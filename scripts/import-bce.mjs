// Import BCE Open Data (Banque-Carrefour des Entreprises) → lib/bce-data.json
//
// Entrée : les CSV du zip « KboOpenData_..._Full.zip » (portal BCE Open Data),
// extraits dans le dossier passé en argument (défaut : ./bce-extract).
//
// Pipeline :
//   1. code.csv        → libellés FR des codes NACE (toutes versions confondues)
//   2. establishment.csv → lien établissement → entreprise (personnes physiques)
//   3. address.csv     → adresses en communes wallonnes uniquement
//   4. denomination.csv→ noms (nom commercial prioritaire, FR prioritaire)
//   5. activity.csv    → activité principale (NACE, groupe 001)
//   6. contact.csv     → site web + téléphone
//   7. enterprise.csv  → statut actif uniquement
//   8. mapping NACE → catégorie Voisins & Co (par mots-clés sur le libellé officiel)
//   9. dédoublonnage vs OSM (nom normalisé + localité) → id « bce-<numéro> »
//
// Les fiches BCE sont positionnées au centroïde de la commune (pas de GPS dans
// la BCE) ; la fiche OSM prime donc toujours en cas de doublon.

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, "bce-extract");

const norm = (s) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// ---------------------------------------------------------------- CSV stream
function openCsv(file) {
  const full = path.join(srcDir, file);
  if (!fs.existsSync(full)) return null;
  const rl = readline.createInterface({ input: fs.createReadStream(full, "utf8"), crlfDelay: Infinity });
  let header = null;
  let buf = "";
  const emit = (text) => {
    const row = [];
    let val = "";
    let inQ = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQ) {
        if (ch === '"') { if (text[i + 1] === '"') { val += '"'; i++; } else inQ = false; }
        else val += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ",") { row.push(val); val = ""; }
      else { val += ch; }
    }
    row.push(val);
    return row;
  };
  return {
    async *[Symbol.asyncIterator]() {
      for await (const chunk of rl) {
        buf += chunk + "\n";
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.trim() === "") continue;
          const cells = emit(line);
          if (!header) { header = cells; continue; }
          if (cells.length !== header.length) continue;
          const obj = {};
          for (let k = 0; k < header.length; k++) obj[header[k]] = cells[k];
          yield obj;
        }
      }
      if (buf.trim() !== "" && header) {
        const cells = emit(buf);
        if (cells.length === header.length) {
          const obj = {};
          for (let k = 0; k < header.length; k++) obj[header[k]] = cells[k];
          yield obj;
        }
      }
    },
    close() { rl.close(); },
  };
}

// ------------------------------------------------------- communes wallonnes
const communesRaw = JSON.parse(fs.readFileSync(path.join(root, "lib", "communes.json"), "utf8"));
const communeByNorm = new Map(communesRaw.map((c) => [norm(c.name), c]));

// ------------------------------------------------- mapping NACE → activité
// Règles appliquées au libellé FR officiel du code NACE (ordre : du plus
// spécifique au plus générique). Aucune règle → fiche ignorée (évite les
// holdings, gros, transport, industrie lourde…).
const NACE_RULES = [
  [/commerce de gros|de gros\b/, null],
  [/administration|autorit[ée]s? publiques|h[ôo]pita(ux|l)|activit[ée]s hospitali[èe]res?/, null],
  [/h[ée]bergement|h[ôo]tels?|tour-op[ée]rateurs?|location de logements?/, null],
  [/production de bi[èe]re|fabrication de bi[èe]re|brasseurs?/, "brasserie_artisanale"],
  [/vignobles?|viticulture/, "vignoble"],
  [/distillation|eaux-de-vie|spiritueux de/, "distillerie"],
  [/boulangerie|p[âa]tisserie/, "boulangerie"],
  [/boucherie|bouchers?/, "boucherie"],
  [/poissons?|poissons d/, "poissonnerie"],
  [/fromages?/, "fromagerie"],
  [/chocolaterie|chocolats?/, "chocolaterie"],
  [/confiserie|confiseries?/, "confiserie"],
  [/glaces? (à|a) emporter|glacier/, "glacier"],
  [/sup[ée]rettes?|supers?march[ée]s?|hypermarch[ée]s?|grandes surfaces/, "supermarche"],
  [/[ée]picerie|alimentation g[ée]n[ée]rale/, "epicerie"],
  [/fruits? et l[ée]gumes?|primeurs?|fruits? de/, "primeurs"],
  [/vins?|boissons alcoolis[ée]es/, "vins_spiritueux"],
  [/pharmaceutique|pharmacies?|parapharmacie/, "pharmacie"],
  [/parapharmaceutiques?|cosm[ée]tiques?|articles de toilette/, "esthetique"],
  [/coiffure|perruquiers?/, "coiffeur"],
  [/soins de beaut[ée]|soins du corps|instituts? de beaut[ée]|esth[ée]tique/, "esthetique"],
  [/tatouage|piercing/, "esthetique"],
  [/pratique m[ée]dicale|activit[ée]s m[ée]dicales?|m[ée]decins?/, "medecin"],
  [/dentaires?|dentistes?/, "dentiste"],
  [/v[ée]t[ée]rinaires?/, "veterinaire"],
  [/kin[ée]sith[ée]rapie|kin[ée]sith[ée]rapeutes?/, "kine"],
  [/sages?-femmes?/, "sage_femme"],
  [/podologie|p[ée]dicures?/, "therapeute"],
  [/opticiens?|verres? de contact|optique/, "opticien"],
  [/proth[èe]ses? auditives?|audioproth[èe]ses?/, "appareils_auditifs"],
  [/ambulances?|transport de patients?/, null],
  [/restauration rapide|friteries?/, "fast_food"],
  [/restaurants?|restauration/, "restaurant"],
  [/caf[ée]s?|salons? de th[ée]/, "cafe"],
  [/d[ée]bits? de boissons|bars? de nuit/, "bar_pub"],
  [/stations?-service|carburant|carburants?/, "carburant_recharge"],
  [/lavage de v[ée]hicules?|stations? de lavage/, "garage"],
  [/r[ée]paration de v[ée]hicules?|entretien de v[ée]hicules?|carrosserie|pneumatiques?|garages? de/, "garage"],
  [/commerce de v[ée]hicules? automobiles?/, "garage"],
  [/banques?/, "banque"],
  [/assurances?/, "assurance"],
  [/activit[ée]s? des soci[ée]t[ée]s? holding|holding/, null],
  [/comptables?|comptabilit[ée]|fiscalit[ée]/, "comptabilite"],
  [/avocats?|barreaux/, "avocat"],
  [/notaires?/, "notaire"],
  [/architecture|architectes?/, "architecte"],
  [/ing[ée]nieurs?|engineering/, "ingenieur"],
  [/g[ée]om[èe]tres?|topographie/, "geomestre"],
  [/programmation informatique|conseil en syst[èe]mes? informatiques?|traitement de donn[ée]es?|h[ée]bergement de donn[ée]es?|r[ée]paration d.ordinateurs|mat[ée]riel informatique|t[ée]l[ée]communications?|t[ée]l[ée]phonie/, "informatique"],
  [/conseil pour les affaires et la gestion|conseil de gestion|autres activit[ée]s? de conseil|conseil en/, "conseil"],
  [/publicit[ée]|graphisme|design|communication|relations publiques/, "communication_design"],
  [/photographes?|photographie/, "photographe"],
  [/traducteurs?|interpr[èe]tes?/, "conseil"],
  [/imprimeries?|imprimerie|reprographie/, "reprographie"],
  [/agences? immobili[èe]res?|immobili[èe]res?/, "agence_immobiliere"],
  [/location et gestion/, null],
  [/agences? de voyage|voyages?/, "agence_voyage"],
  [/recherche du personnel|int[ée]rim/, "interim"],
  [/enseignement|formation|formations?|cours/, "enseignement"],
  [/recherche et d[ée]veloppement|recherche scientifique/, "recherche"],
  [/organisations? associatives?|associations?|sans but lucratif/, "asbl_ong"],
  [/maçonnerie|maconnerie|b[ée]ton/, "maconnerie"],
  [/terrassement|travaux de terre/, "terrassement"],
  [/menuiserie|menuisiers?|ch[âa]ssis?/, "menuiserie"],
  [/cuisines?/, "cuisines"],
  [/plomberie|chauffage|[ée]quipements? thermiques?|sanitaires?/, "plomberie_chauffage"],
  [/[ée]nergie solaire|photovolta[ïi]que|panneaux solaires?/, "energie_solaire"],
  [/installation [ée]lectrique|[ée]lectricit[ée] des b[âa]timents?/, "electricien"],
  [/couverture|toiture|toitures?/, "couvreur"],
  [/isolation/, "isolation"],
  [/peinture|peintres?|pl[âa]trerie|rev[êe]tement des murs?/, "peinture"],
  [/carrelage|rev[êe]tements? de sols?|rev[êe]tements? de sols? et murs?/, "carrelage_sols"],
  [/nettoyage|nettoyage de/, "nettoyage"],
  [/d[ée]sinsectisation|d[ée]sinfection|d[ée]ratisation/, "desinsectisation"],
  [/ramonage/, "ramoneur"],
  [/d[ée]m[ée]nagement/, "demagement"],
  [/serrurerie|serruriers?/, "serrurier"],
  [/r[ée]paration de chaussures?|cordonnerie/, "cordonnier"],
  [/travaux de couture|retouches?|couture|confection/, "couture"],
  [/blanchisserie|teinturerie|pressing|laverie|lavage de linge/, "pressing"],
  [/repassage/, "repassage"],
  [/s[ée]curit[ée]|surveillance|gardiennage/, "securite"],
  [/espaces? verts?|jardinage|paysagistes?|jardiniers?|entretien de jardins?/, "jardinage"],
  [/fleuristes?|fleurs?/, "fleuriste"],
  [/animaux de compagnie|animaleries?|animaux domestiques?/, "animalerie"],
  [/toiletteurs?/, "animalerie"],
  [/pompes? fun[èe]bres?|fun[ée]railles?/, "pompes_funebres"],
  [/quincaillerie|quincailleries?/, "quincaillerie"],
  [/bricolage|articles de bricolage/, "bricolage"],
  [/scierie|sciage du bois/, "scierie"],
  [/librairies?|livres?/, "librairie"],
  [/journaux?|presse/, "journaux"],
  [/papeterie|fournitures? de bureau/, "papeterie"],
  [/jouets?/, "jouets"],
  [/articles? de sport|sports?/, "articles_sport"],
  [/v[êe]tements?|habillement|textiles?/, "vetements"],
  [/chaussures?/, "chaussures"],
  [/souvenirs?|cadeaux?/, "cadeaux"],
  [/antiquit[ée]s?|antiquaires?/, "antiquites"],
  [/articles? d.occasion|d.occasion|brocantes?/, "seconde_main"],
  [/meubles?|ameublement/, "meubles"],
  [/d[ée]coration|articles? de d[ée]coration/, "decoration"],
  [/matelas|literie/, "literie"],
  [/t[ée]l[ée]phones?|t[ée]l[ée]phonie mobile/, "gsm"],
  [/[ée]lectronique/, "electronique"],
  [/audio|vid[ée]o|hi-fi/, "hifi_tv"],
  [/enregistrements? sonores?|disques?/, "musique"],
  [/instruments? de musique/, "instruments"],
  [/œuvres? d.art|oeuvres? d.art|galeries? d.art/, "galerie_art"],
  [/billetterie|billets?/, "billetterie"],
  [/[ée]dition|édition/, "edition"],
  [/production de films?|audiovisuel|production cin[ée]matographique/, "medias"],
  [/biblioth[èe]ques?/, "bibliotheque"],
  [/activit[ée]s? des [ée]glises?|religieuses?/, null],
  [/culture|élevage/, "ferme"],
  [/construction|travaux de construction|entrepreneurs? de/, "construction"],
];

const CATEGORY_OF = {
  alimentation: new Set(["boulangerie", "vins_spiritueux", "supermarche", "epicerie", "primeurs", "boucherie", "fromagerie", "poissonnerie", "chocolaterie", "confiserie", "ferme", "glacier"]),
  horeca: new Set(["cafe", "bar_pub", "restaurant", "fast_food"]),
  distributeur: new Set(["carburant_recharge", "distributeur"]),
};

function categoryForGroup(group) {
  if (CATEGORY_OF.alimentation.has(group)) return "alimentation";
  if (CATEGORY_OF.horeca.has(group)) return "horeca";
  if (CATEGORY_OF.distributeur.has(group)) return "distributeur";
  return "artisan";
}

// ------------------------------------------------------------------ passes
console.log("1/8 code.csv — libellés NACE FR…");
const naceLabel = new Map();
{
  const csv = openCsv("code.csv");
  if (csv) {
    for await (const r of csv) {
      const cat = r.Category ?? "";
      if (!/^nace/i.test(cat)) continue;
      const desc = (r.Description ?? "").trim();
      if (!desc) continue;
      const lang = (r.Language ?? "").toUpperCase();
      const prev = naceLabel.get(r.Code);
      if (!prev || lang === "F" || lang === "FR" || lang === "1") {
        naceLabel.set(r.Code, desc.toLowerCase());
      }
    }
  }
}
console.log(`   ${naceLabel.size} codes NACE libellés (FR)`);

const naceGroupCache = new Map();
function groupForNace(code) {
  if (naceGroupCache.has(code)) return naceGroupCache.get(code);
  const label = naceLabel.get(code);
  let group = null;
  if (label) {
    for (const [re, g] of NACE_RULES) {
      if (re.test(label)) { group = g; break; }
    }
  }
  naceGroupCache.set(code, group);
  return group;
}

console.log("2/8 establishment.csv — lien établissement → entreprise…");
const estToEnt = new Map();
{
  const csv = openCsv("establishment.csv");
  if (csv) {
    for await (const r of csv) {
      if (r.EstablishmentNumber && r.EnterpriseNumber) estToEnt.set(r.EstablishmentNumber, r.EnterpriseNumber);
    }
  }
}
console.log(`   ${estToEnt.size} établissements`);

console.log("3/8 address.csv — adresses wallonnes…");
const addrOf = new Map(); // enterpriseNumber → { street, house, zip, town }
{
  const csv = openCsv("address.csv");
  if (csv) {
    for await (const r of csv) {
      const town = (r.MunicipalityFR ?? r.MunicipalityNL ?? "").trim();
      const c = communeByNorm.get(norm(town));
      if (!c) continue;
      let ent = r.EntityNumber ?? "";
      if (estToEnt.has(ent)) ent = estToEnt.get(ent);
      if (!ent || !/^\d/.test(ent)) continue;
      if (!addrOf.has(ent)) {
        addrOf.set(ent, {
          street: (r.StreetFR ?? r.StreetNL ?? "").trim(),
          house: (r.HouseNumber ?? "").trim(),
          box: (r.Box ?? "").trim(),
          zip: (r.Zipcode ?? "").trim(),
          town: c.name,
          lat: c.lat,
          lng: c.lng,
        });
      }
    }
  }
}
console.log(`   ${addrOf.size} entreprises/établissements wallons`);

console.log("4/8 denomination.csv — noms…");
const nameOf = new Map();
{
  const csv = openCsv("denomination.csv");
  if (csv) {
    for await (const r of csv) {
      let ent = r.EntityNumber ?? "";
      if (estToEnt.has(ent)) ent = estToEnt.get(ent);
      if (!addrOf.has(ent)) continue;
      const name = (r.Denomination ?? "").trim();
      if (!name) continue;
      const type = r.TypeOfDenomination ?? "";
      const lang = r.Language ?? "";
      const score =
        (type === "001" ? 0 : type === "003" ? 1 : type === "002" ? 2 : 3) * 10 +
        (lang === "1" || lang === "F" ? 0 : lang === "2" || lang === "N" ? 1 : lang === "3" || lang === "D" ? 2 : 3);
      const prev = nameOf.get(ent);
      if (!prev || score < prev.score) nameOf.set(ent, { name, score });
    }
  }
}
console.log(`   ${nameOf.size} noms retenus`);

console.log("5/8 activity.csv — activités principales…");
const naceOf = new Map();
{
  const csv = openCsv("activity.csv");
  if (csv) {
    for await (const r of csv) {
      if ((r.ActivityGroup ?? "") !== "001") continue;
      let ent = r.EntityNumber ?? "";
      if (estToEnt.has(ent)) ent = estToEnt.get(ent);
      if (!addrOf.has(ent)) continue;
      if (!naceOf.has(ent)) naceOf.set(ent, r.NaceCode ?? "");
    }
  }
}
console.log(`   ${naceOf.size} activités`);

console.log("6/8 contact.csv — sites web et téléphones…");
const contactOf = new Map();
{
  const csv = openCsv("contact.csv");
  if (csv) {
    for await (const r of csv) {
      let ent = r.EntityNumber ?? "";
      if (estToEnt.has(ent)) ent = estToEnt.get(ent);
      if (!addrOf.has(ent)) continue;
      const v = (r.Value ?? "").trim();
      if (!v) continue;
      const cur = contactOf.get(ent) ?? {};
      if (/^https?:\/\//i.test(v)) {
        if (!cur.website) cur.website = v;
      } else if (/^(tel:|\+|0[1-9])/i.test(v) && /\d{6,}/.test(v)) {
        if (!cur.phone) cur.phone = v.replace(/^tel:/i, "");
      } else continue;
      contactOf.set(ent, cur);
    }
  }
}

console.log("7/8 enterprise.csv — statut actif…");
const activeEnt = new Set();
{
  const csv = openCsv("enterprise.csv");
  if (csv) {
    for await (const r of csv) {
      if ((r.Status ?? "").toUpperCase() === "AC" && addrOf.has(r.EnterpriseNumber)) {
        activeEnt.add(r.EnterpriseNumber);
      }
    }
  }
}
console.log(`   ${activeEnt.size} actives`);

console.log("8/8 assemblage + dédoublonnage OSM…");
const osmBusinesses = JSON.parse(fs.readFileSync(path.join(root, "lib", "seed-data.json"), "utf8")).businesses;
const osmKeys = new Set(osmBusinesses.map((b) => `${norm(b.name)}|${norm(b.town)}`));

const DESCRIPTIONS = {
  alimentation: "Alimentation et produits frais, fiche issue de la Banque-Carrefour des Entreprises.",
  horeca: "Table et terrasse du quartier, fiche issue de la Banque-Carrefour des Entreprises.",
  artisan: "Artisan ou service de proximité, fiche issue de la Banque-Carrefour des Entreprises.",
  distributeur: "Distributeur et services 24/7, fiche issue de la Banque-Carrefour des Entreprises.",
};

const out = [];
const seenKeys = new Set();
let skippedDup = 0;
let skippedUnmapped = 0;
for (const ent of activeEnt) {
  const addr = addrOf.get(ent);
  const nameRec = nameOf.get(ent);
  if (!addr || !nameRec) continue;
  const nace = naceOf.get(ent);
  if (!nace) { skippedUnmapped++; continue; }
  const group = groupForNace(nace);
  if (!group) { skippedUnmapped++; continue; }
  const key = `${norm(nameRec.name)}|${norm(addr.town)}`;
  if (osmKeys.has(key) || seenKeys.has(key)) { skippedDup++; continue; }
  seenKeys.add(key);
  const digits = ent.replace(/\D/g, "");
  const bce = digits.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1.$2.$3");
  const contact = contactOf.get(ent) ?? {};
  const category = categoryForGroup(group);
  out.push({
    id: `bce-${digits}`,
    name: nameRec.name,
    category,
    subcategory: group,
    tier: "standard",
    description: DESCRIPTIONS[category],
    address: [addr.street, addr.house].filter(Boolean).join(" ") || "Adresse à compléter",
    town: addr.town,
    postalCode: addr.zip,
    lat: addr.lat,
    lng: addr.lng,
    phone: contact.phone ?? null,
    website: contact.website ?? null,
    hours: null,
    bce,
    news: null,
  });
}

out.sort((a, b) => a.town.localeCompare(b.town, "fr") || a.name.localeCompare(b.name, "fr"));
fs.writeFileSync(path.join(root, "lib", "bce-data.json"), `${JSON.stringify({ businesses: out }, null, 2)}\n`);
console.log(`OK ${out.length} fiches BCE ajoutées (${skippedDup} doublons OSM évités, ${skippedUnmapped} sans activité pertinente)`);
