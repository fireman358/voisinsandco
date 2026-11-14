"use client";

import { useState } from "react";
import { HandHeart, HeartHandshake, Loader2, MapPin, Megaphone, Plus, Trash2, Wrench, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/toast";
import { formatDistance, relativeTime } from "@/lib/format";
import { ARTISAN_CATEGORIES, type GeoState, type Need, type NeedKind } from "@/lib/types";
import { cn } from "@/lib/utils";

function PublishNeedDialog({
  open,
  onOpenChange,
  geo,
  radius,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  geo: GeoState;
  radius: number;
  onCreated: (need: Need) => void;
}) {
  const toast = useToast();
  const [kind, setKind] = useState<NeedKind | null>(null);
  const [artisanCategory, setArtisanCategory] = useState(ARTISAN_CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [sending, setSending] = useState(false);

  const reset = () => {
    setKind(null);
    setTitle("");
    setDescription("");
    setAuthor("");
  };

  const submit = async () => {
    if (!kind || !title.trim()) {
      toast("Choisissez un type de besoin et un titre", "error");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/needs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          kind,
          artisanCategory: kind === "artisan" ? artisanCategory : undefined,
          author: author.trim() || "Voisin·e",
          town: geo.shortLabel,
          lat: geo.lat,
          lng: geo.lng,
        }),
      });
      if (!res.ok) throw new Error("bad status");
      const data = (await res.json()) as { need: Need };
      onCreated(data.need);
      reset();
      onOpenChange(false);
      toast(
        kind === "artisan"
          ? `Besoin publié — alerte instantanée envoyée aux pros du rayon de ${radius} km (simulation)`
          : "Besoin publié sur le mur du quartier !",
        "success",
      );
    } catch {
      toast("Publication impossible, réessayez", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publier un besoin</DialogTitle>
          <DialogDescription>
            Deux façons de poster : entraide gratuite entre voisins, ou recherche d&apos;un artisan du coin.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setKind("entraide")}
            className={cn(
              "flex flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition-colors",
              kind === "entraide"
                ? "border-forest bg-green-50"
                : "border-neutral-200 bg-white hover:border-forest/40",
            )}
          >
            <HeartHandshake className={cn("size-5", kind === "entraide" ? "text-forest" : "text-neutral-400")} />
            <span className="text-sm font-semibold text-neutral-900">Entraide gratuite</span>
            <span className="text-[11px] leading-snug text-neutral-500">
              entre voisins du quartier
            </span>
          </button>
          <button
            type="button"
            onClick={() => setKind("artisan")}
            className={cn(
              "flex flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition-colors",
              kind === "artisan"
                ? "border-accent bg-accent-light/60"
                : "border-neutral-200 bg-white hover:border-accent/50",
            )}
          >
            <Wrench className={cn("size-5", kind === "artisan" ? "text-accent-dark" : "text-neutral-400")} />
            <span className="text-sm font-semibold text-neutral-900">Recherche d&apos;un artisan</span>
            <span className="text-[11px] leading-snug text-neutral-500">
              alerte envoyée aux pros du rayon
            </span>
          </button>
        </div>
        {kind === "artisan" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="need-cat">Métier recherché</Label>
              <select
                id="need-cat"
                value={artisanCategory}
                onChange={(e) => setArtisanCategory(e.target.value)}
                className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
              >
                {ARTISAN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <p className="flex items-start gap-2 rounded-lg bg-accent-light px-3 py-2 text-xs font-medium text-accent-dark">
              <Zap className="mt-0.5 size-3.5 shrink-0" />
              Alerte instantanée simulée : les pros abonnés dans un rayon de {radius} km autour de{" "}
              {geo.shortLabel} seront notifiés.
            </p>
          </>
        )}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="need-title">Titre du besoin</Label>
            <Input
              id="need-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. : aide pour déplacer un frigo samedi"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="need-desc">Détails</Label>
            <Textarea
              id="need-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Précisez quoi, quand, où…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="need-author">Votre prénom</Label>
            <Input
              id="need-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Marie"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={sending || !kind} className="w-full sm:w-auto">
            {sending && <Loader2 className="size-4 animate-spin" />}
            Publier sur le mur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NeedCard({ need, onTake }: { need: Need; onTake: (id: string) => void }) {
  const isArtisan = need.kind === "artisan";
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm">{need.title}</CardTitle>
          {isArtisan ? (
            <Badge variant="amber" className="gap-1 whitespace-nowrap">
              <Wrench className="size-3" /> Artisan{need.artisanCategory ? ` · ${need.artisanCategory}` : ""}
            </Badge>
          ) : (
            <Badge variant="default" className="gap-1 whitespace-nowrap">
              <HeartHandshake className="size-3" /> Entraide gratuite
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {need.description && <p className="text-xs text-neutral-500">{need.description}</p>}
        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-neutral-500">
          <span className="font-medium text-neutral-700">{need.author}</span>
          <span className="inline-flex items-center gap-1 font-medium text-forest">
            <MapPin className="size-3" />
            {formatDistance(need.distanceKm)} • {need.town}
          </span>
          <span>{relativeTime(need.createdAt)}</span>
          <span className="rounded-full bg-green-50 px-2 py-0.5 font-medium text-forest">
            {need.status === "open" ? "Ouvert" : "Pris en charge"}
          </span>
        </p>
        {need.status === "open" && (
          <div className="space-y-1.5 pt-1">
            <Button size="sm" className="w-full" onClick={() => onTake(need.id)}>
              <HandHeart className="size-4" /> {isArtisan ? "Je peux faire ce travail" : "Je peux aider"}
            </Button>
            <p className="text-[10px] leading-tight text-neutral-400">
              {isArtisan
                ? "Artisan ? Reviendique ta fiche dans l'annuaire pour être contacté directement."
                : "Le voisin ou la voisine qui aide convient du moment et du lieu avec l&rsquo;auteur, en vrai ou via le quartier."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MurTab({
  needs,
  geo,
  radius,
  onCreated,
  onDeleted,
  onTaken,
}: {
  needs: Need[];
  geo: GeoState;
  radius: number;
  onCreated: (need: Need) => void;
  onDeleted: (id: string) => void;
  onTaken: (id: string) => void;
}) {
  const take = async (id: string) => {
    onTaken(id);
    try {
      await fetch("/api/needs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // mode démo : mise à jour locale uniquement
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette publication du mur ?")) return;
    onDeleted(id);
    try {
      await fetch(`/api/needs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {
      // mode démo : suppression locale uniquement
    }
  };
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Megaphone className="size-5 text-forest" />
          <h2 className="text-base font-bold text-neutral-900">Le Mur des Besoins</h2>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Publier un besoin
        </Button>
      </div>
      <p className="text-xs text-neutral-500">
        Entraide gratuite entre voisins ou recherche d&apos;un artisan proche — tout se passe dans un rayon de{" "}
        {radius} km autour de {geo.shortLabel}.
      </p>
      {needs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 bg-white py-8 text-center text-sm text-neutral-500">
          Le mur est vide dans ce rayon : soyez le premier à publier un besoin !
        </p>
      ) : (
        <div className="space-y-2.5">
          {needs.map((n) => (
            <div key={n.id} className="relative">
              <NeedCard need={n} onTake={take} />
              <button
                type="button"
                onClick={() => remove(n.id)}
                title="Supprimer"
                aria-label="Supprimer cette publication"
                className="absolute right-2 top-2 rounded-lg p-1.5 text-neutral-300 hover:bg-neutral-100 hover:text-red-500"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <PublishNeedDialog open={open} onOpenChange={setOpen} geo={geo} radius={radius} onCreated={onCreated} />
    </div>
  );
}
