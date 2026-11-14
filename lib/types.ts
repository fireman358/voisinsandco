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
