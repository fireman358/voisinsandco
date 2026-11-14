"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { Business } from "@/lib/types";

interface ClaimDialogProps {
  business: Business | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClaimDialog({ business, open, onOpenChange }: ClaimDialogProps) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  if (!business) return null;

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast("Nom et téléphone requis", "error");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, name, email, phone, message }),
      });
      if (!res.ok) throw new Error("bad status");
      setDone(true);
      toast("Revendication envoyée à l'équipe Voisins & Co", "success");
    } catch {
      toast("Envoi impossible, réessayez dans un instant", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setDone(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revendiquer « {business.name} »</DialogTitle>
          <DialogDescription>
            Justifiez que vous êtes le gérant (n° BCE, appel ou passage en boutique) : la fiche
            passe en <span className="font-medium text-forest">Vérifiée</span> gratuitement après
            validation sous 48h. Ensuite, si vous le souhaitez, nous vous rappelons pour activer un
            pack payant — paiement simple par virement, aucun prélèvement automatique.
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2 className="size-12 text-forest" />
            <p className="font-semibold text-neutral-800">Merci {name.split(" ")[0]} !</p>
            <p className="text-sm text-neutral-500">
              Votre demande est enregistrée. Nous vous contactons au {phone} (appel ou WhatsApp)
              pour vérifier votre fiche — aucun e-mail de domaine n&rsquo;est exigé.
            </p>
            <div className="mt-2 space-y-1 rounded-lg bg-green-50 px-3 py-2 text-left text-xs text-neutral-700">
              <p><span className="font-semibold">Fiche Vérifiée</span> — gratuite après vérification.</p>
              <p><span className="font-semibold">Pack Visibilité</span> — 9 €/mois sans engagement : horaires, photo de vitrine, actualités.</p>
              <p><span className="font-semibold">Pack Pro</span> — 29 €/mois sans engagement : lien site/réseaux, offres flash à 10 km, tête de liste, badge Vérifié.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="claim-name">Nom complet</Label>
              <Input
                id="claim-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="claim-phone">Téléphone / WhatsApp</Label>
              <Input
                id="claim-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+32 4xx xx xx xx"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="claim-email">E-mail (optionnel)</Label>
              <Input
                id="claim-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean@exemple.be"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="claim-msg">Message / justificatif</Label>
              <Textarea
                id="claim-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="N° BCE, nom de la société, photo de la vitrine…"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          {!done && (
            <Button onClick={submit} disabled={sending} className="w-full sm:w-auto">
              {sending && <Loader2 className="size-4 animate-spin" />}
              Envoyer la revendication
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
