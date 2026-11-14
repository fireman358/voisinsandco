import raw from "./demo-data.json";
import type { AgendaEvent, Business, Deal, Need, Tool } from "./types";

// Les constantes de base (points, rayon, plafond) vivent désormais dans
// lib/constants.ts afin que les composants clients n'importent pas ce module
// (qui embarque demo-data.json, ~1,3 Mo, dans le bundle navigateur).

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
