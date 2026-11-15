export type BusinessCategory = "alimentation" | "artisan" | "horeca" | "distributeur";
export type BusinessTier = "standard" | "verified" | "visibility" | "pro";
export type NeedKind = "entraide" | "artisan";

export interface Business {
  id: string;
  name: string;
  category: BusinessCategory;
  subcategory?: string;
  tier: BusinessTier;
  description: string;
  address: string;
  town: string;
  postalCode: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  hours?: string;
  bce?: string;
  news?: string;
  paidUntil?: string | null;
  /** Mise en avant exclusive de secteur (+5 €/mois) : passe avant les Pro. */
  prime?: boolean;
  distanceKm?: number;
}

export interface Deal {
  id: string;
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
  distanceKm?: number;
}

export interface AgendaEvent {
  id: string;
  title: string;
  organizer: string;
  type: string;
  date: string;
  location: string;
  town: string;
  lat: number;
  lng: number;
  distanceKm?: number;
}

export interface Need {
  id: string;
  title: string;
  description: string;
  kind: NeedKind;
  artisanCategory?: string;
  author: string;
  town: string;
  lat: number;
  lng: number;
  status: "open" | "taken";
  createdAt: string;
  distanceKm?: number;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  owner: string;
  town: string;
  lat: number;
  lng: number;
  available: boolean;
  distanceKm?: number;
}

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  alimentation: "Alimentation & Fermes",
  artisan: "Artisans & Services",
  horeca: "Horeca",
  distributeur: "Distributeurs 24/7",
};

/* ------------------------------------------------------------------ *
 * Groupes d'affichage (8) : on regroupe la longue traîne des ~355
 * sous-catégories en catégories lisibles pour l'utilisateur. La base
 * garde les 4 catégories « techniques » (BusinessCategory) ; le groupe
 * est dérivé de la sous-catégorie, avec repli sur la catégorie.
 * ------------------------------------------------------------------ */
export type GroupKey =
  | "alimentation"
  | "horeca"
  | "sante"
  | "maison"
  | "services"
  | "commerces"
  | "auto"
  | "distributeurs"
  | "autres";

export const GROUP_LABELS: Record<GroupKey, string> = {
  alimentation: "Alimentation & Fermes",
  horeca: "Horeca",
  sante: "Santé & bien-être",
  maison: "Maison & artisans",
  services: "Services & professions",
  commerces: "Commerces & loisirs",
  auto: "Auto & mobilité",
  distributeurs: "Distributeurs & services 24/7",
  autres: "Autres",
};

/** Sous-catégorie représentative d'un groupe (quand on reclasse depuis l'admin). */
export const GROUP_REPRESENTATIVE: Record<GroupKey, string> = {
  alimentation: "epicerie",
  horeca: "restaurant",
  sante: "medecin",
  maison: "construction",
  services: "conseil",
  commerces: "vetements",
  auto: "garage",
  distributeurs: "distributeur",
  autres: "divers",
};

/** Catégorie « technique » stockée en base pour un groupe donné. */
export const GROUP_CATEGORY: Record<GroupKey, BusinessCategory> = {
  alimentation: "alimentation",
  horeca: "horeca",
  distributeurs: "distributeur",
  sante: "artisan",
  maison: "artisan",
  services: "artisan",
  commerces: "artisan",
  auto: "artisan",
  autres: "artisan",
};

const GROUP_OF: Record<string, GroupKey> = {
  ferme: "alimentation", farm: "alimentation", beekeeper: "alimentation", honey: "alimentation",
  supermarket: "alimentation", supermarche: "alimentation", convenience: "alimentation", grocery: "alimentation",
  country_store: "alimentation", epicerie: "alimentation", bakery: "alimentation", boulangerie: "alimentation",
  pastry: "alimentation", patisserie: "alimentation", confectionery: "alimentation", confiserie: "alimentation",
  chocolate: "alimentation", chocolatier: "alimentation", chocolaterie: "alimentation",
  cheese: "alimentation", fromagerie: "alimentation", seafood: "alimentation", poissonnerie: "alimentation",
  greengrocer: "alimentation", primeurs: "alimentation", vegetables: "alimentation", food: "alimentation",
  deli: "alimentation", frozen_food: "alimentation", pasta: "alimentation", dairy: "alimentation",
  vins_spiritueux: "alimentation", alcohol: "alimentation", beverages: "alimentation", wine: "alimentation",
  beer: "alimentation", winery: "alimentation", spices: "alimentation", tea: "alimentation",
  syrop_maker: "alimentation", siropery: "alimentation", butcher: "alimentation", boucherie: "alimentation",
  // Horeca
  restaurant: "horeca", fast_food: "horeca", cafe: "horeca", coffee: "horeca", bar: "horeca", pub: "horeca",
  bar_pub: "horeca", brasserie_artisanale: "horeca", brewery: "horeca", distillerie: "horeca",
  distillery: "horeca", ice_cream: "horeca", glacier: "horeca", camping: "horeca", caterer: "horeca",
  // Santé & bien-être
  medecin: "sante", doctors: "sante", physician: "sante", medical: "sante", healthcare: "sante",
  dentiste: "sante", dentist: "sante", kine: "sante", physiotherapist: "sante",
  veterinaire: "sante", veterinary: "sante", pharmacie: "sante", pharmacy: "sante", chemist: "sante",
  esthetique: "sante", beauty: "sante", hairdresser: "sante", coiffeur: "sante",
  therapeute: "sante", therapist: "sante", sage_femme: "sante", opticien: "sante", optician: "sante",
  podologist: "sante", massage: "sante",
  // Maison & artisans
  construction: "maison", construction_company: "maison", builder: "maison", menuiserie: "maison",
  carpenter: "maison", joiner: "maison", plomberie_chauffage: "maison", plumber: "maison", hvac: "maison",
  chauffage: "maison", electricien: "maison", electrician: "maison", electrical: "maison",
  peinture: "maison", painter: "maison", couvreur: "maison", roofer: "maison", maconnerie: "maison",
  isolation: "maison", insulation: "maison", carrelage_sols: "maison", tiler: "maison",
  terrassement: "maison", earthworks: "maison", jardinage: "maison", gardener: "maison",
  hardware: "maison", quincaillerie: "maison", bricolage: "maison", doityourself: "maison",
  serrurier: "maison", locksmith: "maison", key_cutter: "maison", cordonnier: "maison",
  couture: "maison", tailor: "maison", dressmaker: "maison", parquet_layer: "maison", floorer: "maison",
  flooring: "maison", plasterer: "maison", stonemason: "maison", sawmill: "maison", lumberjack: "maison",
  blacksmith: "maison", metal_construction: "maison", metal_works: "maison",
  window_construction: "maison", glaziery: "maison", door_construction: "maison", veranda: "maison",
  upholsterer: "maison", saddler: "maison", cabinet_maker: "maison", tinsmith: "maison", turner: "maison",
  interior_design: "maison", interior_decorator: "maison", cuisines: "maison", garden_centre: "maison",
  geomestre: "maison", surveyor: "maison",
  // Services & professions
  conseil: "services", consulting: "services", avocat: "services", lawyer: "services",
  notaire: "services", notary: "services", comptabilite: "services", accountant: "services",
  assurance: "services", insurance: "services", health_insurance: "services", insurance_agent: "services",
  agence_immobiliere: "services", estate_agent: "services",
  informatique: "services", computer: "services", it: "services", telecom: "services", telecommunication: "services",
  web_design: "services", communication_design: "services", graphic_design: "services",
  publicite: "services", advertising_agency: "services", medias: "services",
  photographe: "services", photographer: "services", photo_studio: "services",
  edition: "services", publisher: "services", book_publisher: "services",
  reprographie: "services", printer: "services", printing: "services",
  securite: "services", security: "services", surveillance: "services",
  nettoyage: "services", cleaning: "services", pressing: "services", ironing: "services",
  demagement: "services", moving_company: "services", interim: "services", employment_agency: "services",
  enseignement: "services", educational_institution: "services", tutoring: "services", tutor: "services",
  government: "services", asbl_ong: "services", association: "services", ngo: "services",
  charity: "services", foundation: "services", union: "services",
  recherche: "services", research: "services", logistics: "services", transport: "services",
  agence_voyage: "services", travel_agent: "services", coworking: "services", event_management: "services",
  pompes_funebres: "services", religion: "services", diplomatic: "services", political_party: "services",
  financial: "services", financial_advisor: "services", tax_advisor: "services", mortgage: "services",
  translator: "services", printmaker: "services", engraver: "services", signmaker: "services",
  clockmaker: "services", watchmaker: "services", secretary: "services", customs: "services",
  energy_supplier: "services", water_utility: "services", call_center: "services", office: "services",
  // Commerces & loisirs
  vetements: "commerces", clothes: "commerces", articles_sport: "commerces", sport: "commerces",
  jouets: "commerces", toys: "commerces", chaussures: "commerces", shoemaker: "services",
  bijouterie: "commerces", jeweller: "commerces", jewelry: "commerces", goldsmith: "commerces",
  fleuriste: "commerces", florist: "commerces", animalerie: "commerces", pet: "commerces",
  librairie: "commerces", book: "commerces", books: "commerces", papeterie: "commerces",
  cadeaux: "commerces", gift: "commerces", musique: "commerces", music: "commerces",
  instruments: "commerces", musical_instrument: "commerces", galerie_art: "commerces",
  antiquites: "commerces", seconde_main: "commerces", second_hand: "commerces",
  decoration: "commerces", meubles: "commerces", literie: "commerces",
  hifi_tv: "commerces", electronique: "commerces", electronics: "commerces",
  journaux: "commerces", newspaper: "commerces", newsagent: "commerces", kiosk: "commerces",
  billetterie: "commerces", pottery: "commerces", sculptor: "commerces",
  cosmetics: "commerces", glasses: "commerces", optique: "commerces", vente_directe: "commerces",
  // Auto & mobilité
  garage: "auto", car_repair: "auto", car_parts: "auto", car_painter: "auto",
  bicycle: "auto", bicycle_repair: "auto", moto: "auto", controle_technique: "auto",
  pneu: "auto", pieces_auto: "auto", agricultural_engines: "auto", taxi: "auto",
  // Distributeurs & services 24/7 (dont banques / ATM)
  carburant_recharge: "distributeurs", fuel: "distributeurs", charging_station: "distributeurs",
  vending_machine: "distributeurs", distributeur: "distributeurs", atm: "distributeurs",
  banque: "distributeurs", bank: "distributeurs",
};

function fallbackGroup(category?: string): GroupKey {
  switch (category) {
    case "alimentation":
      return "alimentation";
    case "horeca":
      return "horeca";
    case "distributeur":
      return "distributeurs";
    default:
      return "autres";
  }
}

/** Groupe d'affichage d'une fiche, dérivé de sa sous-catégorie (repli : catégorie). */
export function groupOf(subcategory?: string, category?: string): GroupKey {
  const key = (subcategory ?? "").toLowerCase().split(";")[0].trim();
  return GROUP_OF[key] ?? fallbackGroup(category);
}


export const SUBCATEGORY_LABELS: Record<string, string> = {
  bakery: "Boulangerie",
  pastry: "Pâtisserie",
  confectionery: "Confiserie",
  chocolate: "Chocolaterie",
  butcher: "Boucherie",
  deli: "Traiteur",
  cheese: "Fromagerie",
  seafood: "Poissonnerie",
  greengrocer: "Primeurs",
  farm: "Ferme",
  supermarket: "Supermarché",
  convenience: "Épicerie",
  frozen_food: "Surgelés",
  nutrition: "Diététique",
  pasta: "Pâtes fraîches",
  alcohol: "Alcools",
  beverages: "Boissons",
  wine: "Vins",
  beer: "Bières",
  tea: "Thé & café",
  coffee: "Café de spécialité",
  restaurant: "Restaurant",
  fast_food: "Restauration rapide",
  cafe: "Café",
  bar: "Bar",
  pub: "Pub",
  ice_cream: "Glacier",
  pharmacy: "Pharmacie",
  doctors: "Médecin",
  dentist: "Dentiste",
  veterinary: "Vétérinaire",
  hairdresser: "Coiffeur",
  beauty: "Esthétique & bien-être",
  massage: "Massage",
  florist: "Fleuriste",
  hardware: "Quincaillerie",
  doityourself: "Bricolage",
  garden_centre: "Jardinage",
  pet: "Animalerie",
  pet_grooming: "Toiletteur animalier",
  bicycle: "Réparateur vélo",
  car_repair: "Garage",
  car_parts: "Pièces auto",
  fuel: "Station-service",
  charging_station: "Borne de recharge",
  vending_machine: "Distributeur",
  atm: "Distributeur de billets",
  bank: "Banque",
  insurance: "Assurance",
  estate_agent: "Agence immobilière",
  funeral_directors: "Pompes funèbres",
  laundry: "Laverie",
  tailor: "Tailleur",
  dressmaker: "Couture",
  shoemaker: "Cordonnier",
  locksmith: "Serrurier",
  jeweller: "Bijouterie",
  jewellery: "Bijouterie",
  watchmaker: "Horloger",
  optician: "Opticien",
  hearing_aids: "Appareils auditifs",
  photo: "Photographe",
  photographer: "Photographe",
  copyshop: "Reprographie",
  carpenter: "Menuisier",
  joiner: "Menuisier",
  window_construction: "Châssis & menuiserie",
  stairs: "Escalierier",
  furniture_maker: "Ébéniste",
  plumber: "Plombier",
  electrician: "Électricien",
  roofer: "Couvreur",
  gardener: "Jardinier",
  painter: "Peintre",
  plasterer: "Plâtrier",
  tiler: "Carreleur",
  floorer: "Poseur de sols",
  bricklayer: "Maçon",
  mason: "Maçon",
  concrete_construction: "Béton",
  metal_construction: "Construction métallique",
  heating_construction: "Chauffage",
  heat_pumps: "Pompes à chaleur",
  hvac: "Chauffage & ventilation",
  solar_installation: "Panneaux solaires",
  insulation: "Isolation",
  building: "Gros œuvre",
  excavator: "Terrassement",
  landscaper: "Paysagiste",
  cleaning: "Nettoyage",
  window_cleaning: "Nettoyage de vitres",
  chimney_sweep: "Ramoneur",
  pest_control: "Désinsectisation",
  security: "Sécurité",
  moving_company: "Déménagement",
  dry_cleaning: "Pressing",
  ironing: "Repassage",
  sawmill: "Scierie",
  brewery: "Brasserie",
  winery: "Vignoble",
  distillery: "Distillerie",
  department_store: "Grand magasin",
  books: "Librairie",
  newsagent: "Journaux",
  stationery: "Papeterie",
  toys: "Jouets",
  sports: "Articles de sport",
  clothes: "Vêtements",
  shoes: "Chaussures",
  gift: "Cadeaux",
  second_hand: "Seconde main",
  antiques: "Antiquités",
  furniture: "Meubles",
  interior_decoration: "Décoration",
  kitchen: "Cuisines",
  bed: "Literie",
  electronics: "Électronique",
  computer: "Informatique",
  mobile_phone: "GSM",
  radiotechnics: "Hi-fi & TV",
  music: "Musique",
  musical_instrument: "Instruments de musique",
  art: "Galerie d'art",
  ticket: "Billetterie",
  travel_agency: "Agence de voyage",
  photocopying: "Photocopie",
  bookmaker: "Paris",
  charity: "Entraide & solidarité",
  it: "Informatique",
  company: "Société",
  lawyer: "Avocat",
  notary: "Notaire",
  accountant: "Comptabilité",
  tax_advisor: "Conseil fiscal",
  financial: "Services financiers",
  consulting: "Conseil",
  consultant: "Conseil",
  graphic_design: "Design graphique",
  advertising: "Publicité",
  marketing: "Marketing",
  publisher: "Édition",
  newspaper: "Presse",
  media: "Médias",
  architect: "Architecte",
  engineer: "Ingénieur",
  surveyor: "Géomètre",
  construction: "Construction",
  employment_agency: "Intérim & emploi",
  educational_institution: "Enseignement",
  research: "Recherche",
  ngo: "ASBL / ONG",
  government: "Administration publique",
  therapist: "Thérapeute",
  physiotherapist: "Kinésithérapie",
  midwife: "Sage-femme",
  coworking: "Espace de coworking",
  telecommunication: "Télécoms",
  energy_supplier: "Fournisseur d'énergie",
};

export function subcategoryLabel(value?: string): string {
  if (!value) return "";
  const known = SUBCATEGORY_LABELS[value];
  if (known) return known.trim();
  return value
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export interface GeoState {
  lat: number;
  lng: number;
  label: string;
  shortLabel: string;
  isGeo: boolean;
}

export const ARTISAN_CATEGORIES = [
  "Plomberie",
  "Électricité",
  "Chauffage",
  "Couverture",
  "Menuiserie",
  "Jardinage",
  "Autre",
];

// Regroupements logiques des activités (façon Google Maps) : plusieurs valeurs
// OpenStreetMap brutes partagent une même catégorie affichable, sans redondance.
export const SUBCATEGORY_GROUPS: Record<string, string> = {
  bakery: "boulangerie", pastry: "boulangerie",
  alcohol: "vins_spiritueux", beverages: "vins_spiritueux", wine: "vins_spiritueux", beer: "vins_spiritueux",
  bar: "bar_pub", pub: "bar_pub",
  cafe: "cafe",
  restaurant: "restaurant", fast_food: "fast_food", ice_cream: "glacier",
  supermarket: "supermarche", department_store: "supermarche", convenience: "epicerie", greengrocer: "primeurs",
  butcher: "boucherie", deli: "traiteur", cheese: "fromagerie", seafood: "poissonnerie",
  farm: "ferme", frozen_food: "surgeles", nutrition: "dietetique", chocolate: "chocolaterie",
  confectionery: "confiserie", pasta: "pates_fraiches", tea: "the_cafe", coffee: "the_cafe",
  pharmacy: "pharmacie", doctors: "medecin", dentist: "dentiste", veterinary: "veterinaire",
  physiotherapist: "kine", midwife: "sage_femme", therapist: "therapeute",
  hairdresser: "coiffeur", beauty: "esthetique", massage: "esthetique",
  florist: "fleuriste", garden_centre: "jardinage", gardener: "jardinage", landscaper: "jardinage",
  pet: "animalerie", pet_grooming: "animalerie",
  bicycle: "reparateur_velo", car_repair: "garage", car_parts: "garage",
  fuel: "carburant_recharge", charging_station: "carburant_recharge",
  vending_machine: "distributeur", atm: "distributeur",
  bank: "banque", insurance: "assurance", financial: "services_financiers",
  accountant: "comptabilite", tax_advisor: "comptabilite",
  estate_agent: "agence_immobiliere",
  it: "informatique", computer: "informatique", telecommunication: "informatique",
  consulting: "conseil", consultant: "conseil",
  graphic_design: "communication_design", advertising: "communication_design", marketing: "communication_design",
  photographer: "photographe", photo: "photographe",
  lawyer: "avocat", notary: "notaire",
  architect: "architecte", engineer: "ingenieur", surveyor: "geomestre",
  construction: "construction", building: "construction", mason: "maconnerie", bricklayer: "maconnerie",
  concrete_construction: "maconnerie", excavator: "terrassement",
  carpenter: "menuiserie", joiner: "menuiserie", window_construction: "menuiserie", furniture_maker: "menuiserie",
  stairs: "menuiserie", kitchen: "cuisines",
  plumber: "plomberie_chauffage", heating_construction: "plomberie_chauffage", hvac: "plomberie_chauffage",
  heat_pumps: "plomberie_chauffage", solar_installation: "energie_solaire",
  electrician: "electricien", roofer: "couvreur", insulation: "isolation",
  painter: "peinture", plasterer: "peinture", tiler: "carrelage_sols", floorer: "carrelage_sols",
  cleaning: "nettoyage", window_cleaning: "nettoyage", chimney_sweep: "ramoneur",
  pest_control: "desinsectisation", security: "securite",
  locksmith: "serrurier", shoemaker: "cordonnier", tailor: "couture", dressmaker: "couture",
  jeweller: "bijouterie", jewellery: "bijouterie", watchmaker: "horloger",
  optician: "opticien", hearing_aids: "appareils_auditifs",
  dry_cleaning: "pressing", ironing: "repassage", laundry: "laverie",
  moving_company: "demagement",
  books: "librairie", newsagent: "journaux", stationery: "papeterie",
  toys: "jouets", sports: "articles_sport", clothes: "vetements", shoes: "chaussures",
  gift: "cadeaux", second_hand: "seconde_main", antiques: "antiquites",
  furniture: "meubles", interior_decoration: "decoration", bed: "literie",
  electronics: "electronique", mobile_phone: "gsm", radiotechnics: "hifi_tv",
  music: "musique", musical_instrument: "instruments", art: "galerie_art",
  hardware: "quincaillerie", doityourself: "bricolage",
  sawmill: "scierie", brewery: "brasserie_artisanale", winery: "vignoble", distillery: "distillerie",
  copyshop: "reprographie", photocopying: "reprographie", ticket: "billetterie",
  travel_agency: "agence_voyage", employment_agency: "interim",
  educational_institution: "enseignement", research: "recherche",
  ngo: "asbl_ong", charity: "asbl_ong", coworking: "coworking",
  office: "bureaux", company: "bureaux",
  energy_supplier: "energie", government: "administration", newspaper: "presse",
  publisher: "edition", media: "medias", library: "bibliotheque",
  bookmaker: "paris", funeral_directors: "pompes_funebres",
};

export const SUBCATEGORY_GROUP_LABELS: Record<string, string> = {
  boulangerie: "Boulangerie & pâtisserie",
  vins_spiritueux: "Vins & spiritueux",
  bar_pub: "Bar & pub",
  cafe: "Café & salon de thé",
  restaurant: "Restaurant",
  fast_food: "Restauration rapide",
  glacier: "Glacier",
  supermarche: "Supermarché & grand magasin",
  epicerie: "Épicerie & night shop",
  primeurs: "Primeurs",
  boucherie: "Boucherie",
  traiteur: "Traiteur & charcuterie",
  fromagerie: "Fromagerie",
  poissonnerie: "Poissonnerie",
  ferme: "Ferme & producteur",
  surgeles: "Surgelés",
  dietetique: "Diététique",
  chocolaterie: "Chocolaterie",
  confiserie: "Confiserie",
  pates_fraiches: "Pâtes fraîches",
  the_cafe: "Thé & café (boutique)",
  pharmacie: "Pharmacie",
  medecin: "Médecin",
  dentiste: "Dentiste",
  veterinaire: "Vétérinaire",
  kine: "Kinésithérapie",
  sage_femme: "Sage-femme",
  therapeute: "Thérapeute",
  coiffeur: "Coiffeur",
  esthetique: "Esthétique & bien-être",
  fleuriste: "Fleuriste",
  jardinage: "Jardinage & paysagisme",
  animalerie: "Animalerie & toiletteur",
  reparateur_velo: "Réparateur vélo",
  garage: "Garage & pièces auto",
  carburant_recharge: "Station-service & recharge",
  distributeur: "Distributeur 24/7",
  banque: "Banque",
  assurance: "Assurance",
  services_financiers: "Services financiers",
  comptabilite: "Comptabilité & fiscalité",
  agence_immobiliere: "Agence immobilière",
  informatique: "Informatique & télécoms",
  conseil: "Conseil",
  vente_directe: "VDI & vente à domicile",
  communication_design: "Communication & design",
  photographe: "Photographe",
  avocat: "Avocat",
  notaire: "Notaire",
  architecte: "Architecte",
  ingenieur: "Ingénieur",
  geomestre: "Géomètre",
  construction: "Construction",
  maconnerie: "Maçonnerie & béton",
  terrassement: "Terrassement",
  menuiserie: "Menuiserie & châssis",
  cuisines: "Cuisines sur mesure",
  plomberie_chauffage: "Plomberie & chauffage",
  energie_solaire: "Panneaux solaires",
  electricien: "Électricien",
  couvreur: "Couvreur",
  isolation: "Isolation",
  peinture: "Peinture & plâtrerie",
  carrelage_sols: "Carrelage & sols",
  nettoyage: "Nettoyage",
  ramoneur: "Ramoneur",
  desinsectisation: "Désinsectisation",
  securite: "Sécurité",
  serrurier: "Serrurier",
  cordonnier: "Cordonnier",
  couture: "Couture & retouches",
  bijouterie: "Bijouterie",
  horloger: "Horloger",
  opticien: "Opticien",
  appareils_auditifs: "Appareils auditifs",
  pressing: "Pressing",
  repassage: "Repassage",
  laverie: "Laverie",
  demagement: "Déménagement",
  librairie: "Librairie",
  journaux: "Journaux & presse",
  papeterie: "Papeterie",
  jouets: "Jouets",
  articles_sport: "Articles de sport",
  vetements: "Vêtements",
  chaussures: "Chaussures",
  cadeaux: "Cadeaux",
  seconde_main: "Seconde main",
  antiquites: "Antiquités",
  meubles: "Meubles",
  decoration: "Décoration",
  literie: "Literie",
  electronique: "Électronique",
  gsm: "GSM & téléphonie",
  hifi_tv: "Hi-fi & TV",
  musique: "Disques & musique",
  instruments: "Instruments de musique",
  galerie_art: "Galerie d'art",
  quincaillerie: "Quincaillerie",
  bricolage: "Bricolage",
  scierie: "Scierie",
  brasserie_artisanale: "Brasserie artisanale",
  vignoble: "Vignoble",
  distillerie: "Distillerie",
  reprographie: "Reprographie",
  billetterie: "Billetterie",
  agence_voyage: "Agence de voyage",
  interim: "Intérim & emploi",
  enseignement: "Enseignement & formation",
  recherche: "Recherche",
  asbl_ong: "ASBL & solidarité",
  coworking: "Espace de coworking",
  bureaux: "Bureaux d'entreprise",
  energie: "Fournisseur d'énergie",
  administration: "Administration publique",
  presse: "Presse & médias",
  edition: "Édition",
  medias: "Médias",
  bibliotheque: "Bibliothèque",
  paris: "Paris & jeux",
  pompes_funebres: "Pompes funèbres",
};

export function activityKey(subcategory?: string): string {
  if (!subcategory) return "";
  return SUBCATEGORY_GROUPS[subcategory] ?? subcategory;
}

export function activityLabel(subcategory?: string): string {
  if (!subcategory) return "";
  const key = activityKey(subcategory);
  return SUBCATEGORY_GROUP_LABELS[key] ?? subcategoryLabel(subcategory);
}
