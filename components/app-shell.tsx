"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgePercent,
  Loader2,
  MessagesSquare,
  Store,
  Wrench,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderBar } from "@/components/header-bar";
import { NeighbourhoodMotif } from "@/components/neighbourhood-motif";
import { AnnuaireTab } from "@/components/tabs/annuaire-tab";
import { BonsPlansTab } from "@/components/tabs/bons-plans-tab";
import { MurTab } from "@/components/tabs/mur-tab";
import { OutilsTab } from "@/components/tabs/outils-tab";
import { useToast } from "@/components/toast";
import { DEFAULT_BASE, DEFAULT_RADIUS } from "@/lib/constants";
import { haversineKm } from "@/lib/geo";
import type { AgendaEvent, Business, Deal, GeoState, Need, Tool } from "@/lib/types";
import { fetchJSON } from "@/lib/utils";

export interface AppShellInitialData {
  items: Business[];
  total: number;
  demo: boolean;
}

export function AppShell({ initialData }: { initialData?: AppShellInitialData }) {
  const toast = useToast();
  const [geo, setGeoState] = useState<GeoState>(() => {
    try {
      const saved = localStorage.getItem("voisins-geo");
      if (saved) {
        const g = JSON.parse(saved) as GeoState;
        if (typeof g.lat === "number" && typeof g.lng === "number") return g;
      }
    } catch {}
    return {
      lat: DEFAULT_BASE.lat,
      lng: DEFAULT_BASE.lng,
      label: DEFAULT_BASE.label,
      shortLabel: DEFAULT_BASE.shortLabel,
      isGeo: false,
    };
  });
  const setGeo = useCallback((g: GeoState) => {
    setGeoState(g);
    try {
      localStorage.setItem("voisins-geo", JSON.stringify(g));
    } catch {}
  }, []);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTick, setSearchTick] = useState(0);
  const [tab, setTab] = useState("annuaire");
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(initialData?.demo ?? false);
  const [businesses, setBusinesses] = useState<Business[]>(initialData?.items ?? []);
  const [total, setTotal] = useState(initialData?.total ?? initialData?.items?.length ?? 0);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = `lat=${geo.lat}&lng=${geo.lng}&radius=${radius}`;
    const sq = searchQuery.trim().length >= 2 ? `&q=${encodeURIComponent(searchQuery.trim())}` : "";
    try {
      const [b, d, n, t] = await Promise.all([
        fetchJSON<{ items: Business[]; total?: number; demo: boolean }>(`/api/businesses?${qs}${sq}`),
        fetchJSON<{ deals: Deal[]; events: AgendaEvent[]; demo: boolean }>(`/api/deals?${qs}`),
        fetchJSON<{ items: Need[]; demo: boolean }>(`/api/needs?${qs}`),
        fetchJSON<{ items: Tool[]; demo: boolean }>(`/api/tools?${qs}`),
      ]);
      setBusinesses(b.items ?? []);
      setTotal(b.total ?? b.items?.length ?? 0);
      setDemo(Boolean(b.demo));
      setDeals(d.deals ?? []);
      setEvents(d.events ?? []);
      setNeeds(n.items ?? []);
      setTools(t.items ?? []);
    } catch {
      toast("Impossible de charger les données du quartier", "error");
    } finally {
      setLoading(false);
    }
  }, [geo, radius, searchTick, toast]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const t = setTimeout(() => setSearchTick((n) => n + 1), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);
  useEffect(() => {
    if (localStorage.getItem("voisins-geo")) return;
    fetchJSON<{ city: string | null; lat?: number; lng?: number }>("/api/geo")
      .then((g) => {
        if (!g.city || typeof g.lat !== "number" || typeof g.lng !== "number") return;
        setGeo({
          lat: g.lat,
          lng: g.lng,
          label: g.city,
          shortLabel: g.city,
          isGeo: false,
        });
        toast(`Centré sur ${g.city} — ta zone détectée`, "success");
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBusinessCreated = useCallback(
    (b: Business) => {
      setBusinesses((prev) => [
        { ...b, distanceKm: haversineKm(geo.lat, geo.lng, b.lat, b.lng) },
        ...prev,
      ]);
      setTotal((t) => t + 1);
    },
    [geo.lat, geo.lng],
  );

  const handleCitySelect = useCallback(
    (city: { name: string; lat: number; lng: number }) => {
      setGeo({ lat: city.lat, lng: city.lng, label: city.name, shortLabel: city.name, isGeo: false });
      toast(`Rayon recentré sur ${city.name}`, "success");
    },
    [setGeo, toast],
  );

  const handleUseGps = useCallback(() => {
    if (!navigator.geolocation) {
      toast("Géolocalisation indisponible sur cet appareil (PC ?) — cherche ta ville ci-dessus", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Position actuelle",
          shortLabel: "ma position",
          isGeo: true,
        });
        toast("Position actuelle utilisée", "success");
      },
      () => toast("GPS indisponible ou refusé — cherche ta ville ci-dessus", "error"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [setGeo, toast]);

  return (
    <div className="min-h-dvh bg-paper">
      <HeaderBar
        geo={geo}
        radius={radius}
        demo={demo}
        count={total}
        onRadiusChange={setRadius}
        onCitySelect={handleCitySelect}
        onUseGps={handleUseGps}
      />
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 md:max-w-5xl xl:max-w-7xl">
        {loading && businesses.length === 0 && needs.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-neutral-500">
            <Loader2 className="size-5 animate-spin text-forest" /> Chargement du quartier…
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsContent value="annuaire" className="mt-0">
              <AnnuaireTab
                businesses={businesses}
                loading={loading}
                center={{ lat: geo.lat, lng: geo.lng }}
                geoShortLabel={geo.shortLabel}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onCreated={handleBusinessCreated}
              />
            </TabsContent>
            <TabsContent value="bons-plans" className="mt-0">
              <BonsPlansTab deals={deals} events={events} loading={loading} geo={geo} />
            </TabsContent>
            <TabsContent value="mur" className="mt-0">
              <MurTab needs={needs} geo={geo} radius={radius} onCreated={(n) => setNeeds((prev) => [n, ...prev])} onDeleted={(id) => setNeeds((prev) => prev.filter((x) => x.id !== id))} onTaken={(id) => setNeeds((prev) => prev.map((n) => (n.id === id ? { ...n, status: "taken" as const } : n)))} />
            </TabsContent>
            <TabsContent value="outils" className="mt-0">
              <OutilsTab tools={tools} loading={loading} geo={geo} onDeleted={(id) => setTools((prev) => prev.filter((x) => x.id !== id))} onCreated={(t) => setTools((prev) => [t, ...prev])} />
            </TabsContent>
            <TabsList className="fixed bottom-0 left-1/2 z-40 grid h-16 w-full max-w-3xl -translate-x-1/2 grid-cols-4 gap-0 border-t border-neutral-200 bg-white/95 px-1 backdrop-blur md:max-w-5xl xl:max-w-7xl">
              <TabsTrigger
                value="annuaire"
                className="flex flex-col items-center gap-1 rounded-none data-[state=active]:bg-green-50/60"
              >
                <Store className="size-5" />
                <span className="text-[10px] font-medium">Annuaire</span>
              </TabsTrigger>
              <TabsTrigger
                value="bons-plans"
                className="flex flex-col items-center gap-1 rounded-none data-[state=active]:bg-green-50/60"
              >
                <BadgePercent className="size-5" />
                <span className="text-[10px] font-medium">Bons plans</span>
              </TabsTrigger>
              <TabsTrigger
                value="mur"
                className="flex flex-col items-center gap-1 rounded-none data-[state=active]:bg-green-50/60"
              >
                <MessagesSquare className="size-5" />
                <span className="text-[10px] font-medium">Le Mur</span>
              </TabsTrigger>
              <TabsTrigger
                value="outils"
                className="flex flex-col items-center gap-1 rounded-none data-[state=active]:bg-green-50/60"
              >
                <Wrench className="size-5" />
                <span className="text-[10px] font-medium">Outils</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      <footer className="relative overflow-hidden border-t border-white/10 bg-forest-950 px-4 py-3 text-center text-[11px] leading-5 text-neutral-400">
        <NeighbourhoodMotif className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.04]" />
        <div className="relative">
          <p>
            Une réalisation{" "}
            <a
              href="https://edukisto.win/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-accent underline-offset-2 hover:underline"
            >
              Edukisto
            </a>{" "}
            — votre informaticien de proximité
          </p>
          <p className="mt-1">
            Données © les{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline-offset-2 hover:underline"
            >
              contributeurs d&apos;OpenStreetMap
            </a>{" "}
            (ODbL) ·{" "}
            <Link href="/abonnements" className="text-accent underline-offset-2 hover:underline">
              Les formules
            </Link>{" "}
            ·{" "}
            <Link href="/legal" className="text-accent underline-offset-2 hover:underline">
              Mentions légales &amp; confidentialité
            </Link>{" "}
            ·{" "}
            <Link href="/admin" title="Console" className="text-neutral-500 hover:text-accent">
              •
            </Link>
          </p>
        </div>
      </footer>
      </main>
    </div>
  );
}
