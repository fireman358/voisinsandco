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
import { AnnuaireTab } from "@/components/tabs/annuaire-tab";
import { BonsPlansTab } from "@/components/tabs/bons-plans-tab";
import { MurTab } from "@/components/tabs/mur-tab";
import { OutilsTab } from "@/components/tabs/outils-tab";
import { useToast } from "@/components/toast";
import { DEFAULT_BASE } from "@/lib/seed";
import type { AgendaEvent, Business, Deal, GeoState, Need, Tool } from "@/lib/types";
import { fetchJSON } from "@/lib/utils";

export function AppShell() {
  const toast = useToast();
  const [geo, setGeo] = useState<GeoState>({
    lat: DEFAULT_BASE.lat,
    lng: DEFAULT_BASE.lng,
    label: DEFAULT_BASE.label,
    shortLabel: DEFAULT_BASE.shortLabel,
    isGeo: false,
  });
  const [radius, setRadius] = useState(10);
  const [tab, setTab] = useState("annuaire");
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = `lat=${geo.lat}&lng=${geo.lng}&radius=${radius}`;
    try {
      const [b, d, n, t] = await Promise.all([
        fetchJSON<{ items: Business[]; demo: boolean }>(`/api/businesses?${qs}`),
        fetchJSON<{ deals: Deal[]; events: AgendaEvent[]; demo: boolean }>(`/api/deals?${qs}`),
        fetchJSON<{ items: Need[]; demo: boolean }>(`/api/needs?${qs}`),
        fetchJSON<{ items: Tool[]; demo: boolean }>(`/api/tools?${qs}`),
      ]);
      setBusinesses(b.items ?? []);
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
  }, [geo, radius, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCitySelect = useCallback(
    (city: { name: string; lat: number; lng: number }) => {
      setGeo({ lat: city.lat, lng: city.lng, label: city.name, shortLabel: city.name, isGeo: false });
    },
    [],
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
  }, [toast]);

  return (
    <div className="min-h-dvh bg-paper">
      <HeaderBar
        geo={geo}
        radius={radius}
        demo={demo}
        count={businesses.length}
        onRadiusChange={setRadius}
        onCitySelect={handleCitySelect}
        onUseGps={handleUseGps}
      />
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4">
        {loading && businesses.length === 0 && needs.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-neutral-500">
            <Loader2 className="size-5 animate-spin text-forest" /> Chargement du quartier…
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsContent value="annuaire" className="mt-0">
              <AnnuaireTab businesses={businesses} loading={loading} center={{ lat: geo.lat, lng: geo.lng }} />
            </TabsContent>
            <TabsContent value="bons-plans" className="mt-0">
              <BonsPlansTab deals={deals} events={events} loading={loading} />
            </TabsContent>
            <TabsContent value="mur" className="mt-0">
              <MurTab needs={needs} geo={geo} radius={radius} onCreated={(n) => setNeeds((prev) => [n, ...prev])} />
            </TabsContent>
            <TabsContent value="outils" className="mt-0">
              <OutilsTab tools={tools} loading={loading} />
            </TabsContent>
            <TabsList className="fixed bottom-0 left-1/2 z-40 grid h-16 w-full max-w-3xl -translate-x-1/2 grid-cols-4 gap-0 border-t border-neutral-200 bg-white/95 px-1 backdrop-blur">
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
      </main>
      <footer className="border-t border-neutral-200 bg-anthracite px-4 py-4 text-center text-xs text-neutral-300">
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
          <Link href="/legal" className="text-accent underline-offset-2 hover:underline">
            Mentions légales &amp; confidentialité
          </Link>
        </p>
      </footer>
    </div>
  );
}
