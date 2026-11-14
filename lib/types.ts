export type BusinessCategory = "alimentation" | "artisan" | "horeca" | "distributeur";
export type BusinessTier = "standard" | "verified" | "pro";
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
