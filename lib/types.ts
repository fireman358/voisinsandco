export type BusinessCategory = "alimentation" | "artisan" | "horeca" | "distributeur";
export type BusinessTier = "standard" | "verified" | "pro";
export type NeedKind = "entraide" | "artisan";

export interface Business {
  id: string;
  name: string;
  category: BusinessCategory;
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
  artisan: "Artisans",
  horeca: "Horeca",
  distributeur: "Distributeurs 24/7",
};

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
