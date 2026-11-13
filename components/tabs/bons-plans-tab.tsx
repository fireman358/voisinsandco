"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  Hammer,
  Loader2,
  MapPin,
  PackageOpen,
  ShoppingBasket,
  ShoppingCart,
  Store,
  Tag,
  UtensilsCrossed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/toast";
import { formatDateFr, formatDistance, formatPrice } from "@/lib/format";
import type { AgendaEvent, BusinessCategory, Deal } from "@/lib/types";

const DEAL_ICONS: Record<BusinessCategory, typeof ShoppingBasket> = {
  alimentation: ShoppingBasket,
  artisan: Hammer,
  horeca: UtensilsCrossed,
  distributeur: ShoppingCart,
};

function ReserveDialog({
  deal,
  open,
  onOpenChange,
  onReserved,
}: {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReserved: (dealId: string) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  if (!deal) return null;

  const submit = async () => {
    if (!name.trim()) {
      toast("Indiquez votre prénom pour la réservation", "error");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: deal.id, name, phone }),
      });
      if (!res.ok) throw new Error("bad status");
      const data = (await res.json()) as { code: string };
      setCode(data.code);
      onReserved(deal.id);
      toast("Panier réservé !", "success");
    } catch {
      toast("Réservation impossible, réessayez", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setCode(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{deal.title}</DialogTitle>
          <DialogDescription>
            {deal.businessName} • {formatPrice(deal.price)}
            {deal.originalPrice ? ` au lieu de ${formatPrice(deal.originalPrice)}` : ""} • paiement sur
            place à la caisse.
          </DialogDescription>
        </DialogHeader>
        {code ? (
          <div className="space-y-3 py-2 text-center">
            <div className="rounded-xl border-2 border-dashed border-forest bg-green-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                Code de retrait
              </p>
              <p className="font-mono text-3xl font-bold tracking-[0.2em] text-forest">{code}</p>
            </div>
            <p className="text-sm text-neutral-500">
              Présentez ce code à <span className="font-medium text-neutral-800">{deal.businessName}</span>{" "}
              ({deal.pickup}). Paiement sur place.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="res-name">Votre prénom</Label>
              <Input
                id="res-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marie"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-phone">Téléphone (optionnel)</Label>
              <Input
                id="res-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+32 4xx xx xx xx"
              />
            </div>
            <p className="rounded-lg bg-accent-light px-3 py-2 text-xs text-accent-dark">
              {deal.pickup} • {deal.remaining} restant{deal.remaining > 1 ? "s" : ""}
            </p>
          </div>
        )}
        <DialogFooter>
          {!code && (
            <Button onClick={submit} disabled={sending || deal.remaining <= 0} variant="amber" className="w-full sm:w-auto">
              {sending && <Loader2 className="size-4 animate-spin" />}
              Réserver (paiement sur place)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BonsPlansTab({
  deals,
  events,
  loading,
}: {
  deals: Deal[];
  events: AgendaEvent[];
  loading: boolean;
}) {
  const [localDeals, setLocalDeals] = useState<Deal[]>(deals);
  const [reserveTarget, setReserveTarget] = useState<Deal | null>(null);

  useEffect(() => setLocalDeals(deals), [deals]);

  const onReserved = (dealId: string) =>
    setLocalDeals((ds) => ds.map((d) => (d.id === dealId ? { ...d, remaining: Math.max(0, d.remaining - 1) } : d)));

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="size-5 text-accent" />
          <h2 className="text-base font-bold text-neutral-900">Anti-gaspi du jour</h2>
        </div>
        {loading && localDeals.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">Chargement des bons plans…</p>
        ) : localDeals.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 bg-white py-8 text-center text-sm text-neutral-500">
            Aucun panier invendu dans ce rayon pour le moment.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {localDeals.map((deal) => {
              const Icon = DEAL_ICONS[deal.category] ?? Store;
              return (
                <Card key={deal.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-accent-light text-accent-dark">
                          <Icon className="size-4.5" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{deal.title}</CardTitle>
                          <CardDescription className="text-xs">{deal.businessName}</CardDescription>
                        </div>
                      </div>
                      {deal.remaining <= 2 && deal.remaining > 0 && (
                        <Badge variant="amber" className="whitespace-nowrap text-[10px]">
                          Plus que {deal.remaining}
                        </Badge>
                      )}
                      {deal.remaining <= 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          Épuisé
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-neutral-500">{deal.description}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-accent-dark">{formatPrice(deal.price)}</span>
                      {deal.originalPrice && (
                        <span className="text-xs text-neutral-400 line-through">
                          {formatPrice(deal.originalPrice)}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-[11px] text-neutral-500">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="size-3 text-forest" />
                        {formatDistance(deal.distanceKm)} • {deal.town}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="size-3 text-forest" />
                        {deal.pickup}
                      </p>
                    </div>
                    <Button
                      variant="amber"
                      size="sm"
                      className="w-full"
                      disabled={deal.remaining <= 0}
                      onClick={() => setReserveTarget(deal)}
                    >
                      <PackageOpen className="size-4" />
                      {deal.remaining > 0 ? "Réserver (paiement sur place)" : "Épuisé"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-5 text-forest" />
          <h2 className="text-base font-bold text-neutral-900">Agenda des assos &amp; brocantes</h2>
        </div>
        {events.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 bg-white py-6 text-center text-sm text-neutral-500">
            Aucun événement gratuit dans ce rayon pour le moment.
          </p>
        ) : (
          <div className="space-y-2.5">
            {events.map((e) => (
              <Card key={e.id}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-forest text-white">
                    <span className="text-[10px] font-medium uppercase leading-none">
                      {new Date(e.date).toLocaleDateString("fr-BE", { month: "short" })}
                    </span>
                    <span className="text-base font-bold leading-tight">
                      {new Date(e.date).getDate()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900">{e.title}</p>
                    <p className="text-xs text-neutral-500">
                      {e.organizer} • <Badge variant="secondary" className="text-[10px]">{e.type}</Badge>
                    </p>
                    <p className="mt-1 text-xs capitalize text-neutral-500">
                      {formatDateFr(e.date)} • {e.location}, {e.town}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-forest">
                      <MapPin className="size-3" />
                      {formatDistance(e.distanceKm)} • {e.town}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <ReserveDialog
        deal={reserveTarget}
        open={reserveTarget !== null}
        onOpenChange={(o) => {
          if (!o) setReserveTarget(null);
        }}
        onReserved={onReserved}
      />
    </div>
  );
}
