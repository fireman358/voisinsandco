import raw from "./demo-data.json";
import type { AgendaEvent, Business, Deal, Need, Tool } from "./types";

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

const HOUR = 3600_000;
const DAY = 24 * HOUR;

type RawDeal = Omit<Deal, "expiresAt"> & { expiresOffsetHours: number };
type RawEvent = Omit<AgendaEvent, "date"> & { dateOffsetDays: number };
type RawNeed = Omit<Need, "createdAt" | "status"> & { createdOffsetHours: number };

export const BUSINESSES: Business[] = raw.businesses as Business[];

export const DEALS: Deal[] = (raw.deals as RawDeal[]).map(({ expiresOffsetHours, ...rest }) => ({
  ...rest,
  expiresAt: new Date(Date.now() + expiresOffsetHours * HOUR).toISOString(),
}));

export const EVENTS: AgendaEvent[] = (raw.events as RawEvent[]).map(({ dateOffsetDays, ...rest }) => ({
  ...rest,
  date: new Date(Date.now() + dateOffsetDays * DAY).toISOString(),
}));

export const NEEDS: Need[] = (raw.needs as RawNeed[]).map(({ createdOffsetHours, ...rest }) => ({
  ...rest,
  status: "open" as const,
  createdAt: new Date(Date.now() - createdOffsetHours * HOUR).toISOString(),
}));

export const TOOLS: Tool[] = raw.tools as Tool[];
