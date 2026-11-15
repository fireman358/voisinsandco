export interface BasePoint {
  key: string;
  label: string;
  shortLabel: string;
  lat: number;
  lng: number;
}

export const BASE_POINTS: BasePoint[] = [
  { key: "arquennes", label: "Arquennes 7181", shortLabel: "Arquennes", lat: 50.568, lng: 4.2746 },
  { key: "seneffe", label: "Seneffe 7180", shortLabel: "Seneffe", lat: 50.5293, lng: 4.2567 },
  { key: "feluy", label: "Feluy 7181", shortLabel: "Feluy", lat: 50.5608, lng: 4.2535 },
  { key: "nivelles", label: "Nivelles 1400", shortLabel: "Nivelles", lat: 50.5928, lng: 4.3244 },
  { key: "baulers", label: "Baulers 1401", shortLabel: "Baulers", lat: 50.579, lng: 4.305 },
];

export const DEFAULT_BASE = BASE_POINTS[0];

export const RADIUS_OPTIONS = [2, 5, 10, 15];

/** Rayon par défaut à l'ouverture : on privilégie la proximité immédiate. */
export const DEFAULT_RADIUS = 2;

/** Nombre maximal de fiches renvoyées par /api/businesses (borne la charge utile). */
export const MAX_BUSINESS_RESULTS = 300;
