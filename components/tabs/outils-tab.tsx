"use client";

import { useMemo, useState } from "react";
import { HandHeart, Loader2, MapPin, Search, Wrench } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/toast";
import { formatDistance } from "@/lib/format";
import type { Tool } from "@/lib/types";
import { normalizeText } from "@/lib/utils";

function LoanDialog({
  tool,
  open,
  onOpenChange,
}: {
  tool: Tool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const toast = useToast();
  const [requester, setRequester] = useState("");
  const [dates, setDates] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (!tool) return null;

  const submit = async () => {
    if (!requester.trim()) {
      toast("Indiquez votre prénom", "error");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/loan-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: tool.id, requester, dates, message }),
      });
      if (!res.ok) throw new Error("bad status");
      toast(`Demande de prêt envoyée à ${tool.owner} !`, "success");
      onOpenChange(false);
      setRequester("");
      setDates("");
      setMessage("");
    } catch {
      toast("Envoi impossible, réessayez", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demander le prêt : {tool.name}</DialogTitle>
          <DialogDescription>
            Prêt gratuit entre voisins — {tool.owner} ({tool.town}) vous répondra directement.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="loan-name">Votre prénom</Label>
            <Input
              id="loan-name"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              placeholder="Thomas"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loan-dates">Dates souhaitées</Label>
            <Input
              id="loan-dates"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              placeholder="Samedi 14 juin, de 9h à 17h"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loan-msg">Message</Label>
            <Textarea
              id="loan-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Pour quel usage ? Comment vous récupérer l'objet…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={sending} className="w-full sm:w-auto">
            {sending && <Loader2 className="size-4 animate-spin" />}
            Envoyer la demande de prêt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OutilsTab({ tools, loading }: { tools: Tool[]; loading: boolean }) {
  const [query, setQuery] = useState("");
  const [loanTarget, setLoanTarget] = useState<Tool | null>(null);

  const filtered = useMemo(() => {
    const s = normalizeText(query.trim());
    if (!s) return tools;
    return tools.filter(
      (t) =>
        normalizeText(t.name).includes(s) ||
        normalizeText(t.description).includes(s) ||
        normalizeText(t.owner).includes(s),
    );
  }, [tools, query]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Wrench className="size-5 text-forest" />
        <h2 className="text-base font-bold text-neutral-900">La Boîte à Outils du Quartier</h2>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher : Kärcher, échelle, remorque, raclette…"
          className="pl-9"
          aria-label="Rechercher un outil"
        />
      </div>
      {loading && tools.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-400">Chargement de la boîte à outils…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 bg-white py-8 text-center text-sm text-neutral-500">
          Aucun outil ne correspond à « {query} » dans ce rayon.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((tool) => (
            <Card key={tool.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-green-50 text-forest">
                      <Wrench className="size-4.5" />
                    </div>
                    <CardTitle className="text-sm">{tool.name}</CardTitle>
                  </div>
                  {tool.available ? (
                    <Badge variant="default" className="whitespace-nowrap text-[10px]">
                      Disponible
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="whitespace-nowrap text-[10px]">
                      Prêté
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">{tool.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-neutral-500">
                  <span className="font-medium text-neutral-700">{tool.owner}</span>
                  <span className="inline-flex items-center gap-1 font-medium text-forest">
                    <MapPin className="size-3" />
                    {formatDistance(tool.distanceKm)} • {tool.town}
                  </span>
                </p>
                <Button
                  variant={tool.available ? "default" : "secondary"}
                  size="sm"
                  className="w-full"
                  disabled={!tool.available}
                  onClick={() => setLoanTarget(tool)}
                >
                  <HandHeart className="size-4" />
                  {tool.available ? "Demander le prêt" : "Indisponible pour le moment"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <LoanDialog
        tool={loanTarget}
        open={loanTarget !== null}
        onOpenChange={(o) => {
          if (!o) setLoanTarget(null);
        }}
      />
    </div>
  );
}
