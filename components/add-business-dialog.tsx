"use client";

import { useState } from "react";
import communesJson from "@/lib/communes.json";
import { Loader2 } from "lucide-react";
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
import { useToast } from "@/components/toast";
import type { Business, BusinessCategory } from "@/lib/types";

const COMMUNES = communesJson as { name: string; lat: number; lng: number }[];

const CATEGORIES: { key: BusinessCategory; label: string }[] = [
  { key: "alimentation", label: "Alimentation & Fermes" },
  { key: "artisan", label: "Artisans & Services" },
  { key: "horeca", label: "Horeca" },
  { key: "distributeur", label: "Distributeurs 24/7" },
];

export function AddBusinessDialog({
  open,
  onOpenChange,
  geo,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  geo: { lat: number; lng: number; shortLabel: string };
  onCreated: (b: Business) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BusinessCategory>("alimentation");
  const [address, setAddress] = useState("");
  const [town, setTown] = useState(geo.shortLabel);
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [hours, setHours] = useState("");
  const [bce, setBce] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [sending, setSending] = useState(false);

  const reset = () => {
    setName("");
    setAddress("");
    setPostalCode("");
    setPhone("");
    setWebsite("");
    setHours("");
    setBce("");
    setContactName("");
    setContactEmail("");
  };

  const submit = async () => {
    if (!name.trim() || !address.trim() || !town.trim() || !contactName.trim() || !contactEmail.trim().includes("@")) {
      toast("Nom, adresse, commune, ton prénom et un e-mail valide sont requis", "error");
      return;
    }
    const q = town.trim().toLowerCase();
    const commune =
      COMMUNES.find((c) => c.name.toLowerCase() === q) ??
      COMMUNES.find((c) => c.name.toLowerCase().startsWith(q)) ??
      COMMUNES.find((c) => c.name.toLowerCase().includes(q));
    const finalTown = commune?.name ?? town.trim();
    setSending(true);
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          address,
          town: finalTown,
          postalCode,
          phone,
          website,
          hours,
          bce,
          contactName,
          contactEmail,
          lat: commune?.lat ?? geo.lat,
          lng: commune?.lng ?? geo.lng,
        }),
      });
      if (res.status === 409) {
        const data = (await res.json()) as { error?: string; business?: Business };
        toast(data.error ?? "Cette fiche existe déjà — revendique-la.", "error");
        if (data.business) onCreated(data.business);
        reset();
        onOpenChange(false);
        return;
      }
      if (!res.ok) throw new Error("bad status");
      const data = (await res.json()) as { business: Business };
      onCreated(data.business);
      toast("Ta fiche est créée et en attente de vérification", "success");
      reset();
      onOpenChange(false);
    } catch {
      toast("Création impossible, réessaie dans un instant", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter mon commerce</DialogTitle>
          <DialogDescription>
            Crée ta fiche en libre-service. Elle est immédiatement visible et rattachée à toi
            (auto-revendiquée) ; l&apos;équipe la vérifie ensuite pour le badge « Vérifiée ».
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="biz-name">Nom du commerce *</Label>
            <Input id="biz-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Boulangerie du Coin" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="biz-cat">Catégorie *</Label>
              <select
                id="biz-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="biz-zip">Code postal</Label>
              <Input id="biz-zip" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="7181" inputMode="numeric" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="biz-addr">Adresse (rue + numéro) *</Label>
            <Input id="biz-addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rue des Carrières 49" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="biz-town">Commune *</Label>
            <Input id="biz-town" list="biz-communes" value={town} onChange={(e) => setTown(e.target.value)} placeholder="Seneffe" />
            <datalist id="biz-communes">
              {COMMUNES.filter((c) => c.name.toLowerCase().startsWith(town.trim().toLowerCase())).slice(0, 8).map((c) => (
                <option key={c.name} value={c.name} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="biz-phone">Téléphone</Label>
              <Input id="biz-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+32 4xx xx xx xx" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="biz-web">Site web</Label>
              <Input id="biz-web" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="biz-hours">Horaires</Label>
              <Input id="biz-hours" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Lu-Ve 8h-18h" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="biz-bce">N° BCE</Label>
              <Input id="biz-bce" value={bce} onChange={(e) => setBce(e.target.value)} placeholder="0XXX.XXX.XXX" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="biz-contact">Ton prénom *</Label>
              <Input id="biz-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="David" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="biz-email">E-mail *</Label>
              <Input id="biz-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="toi@exemple.be" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={sending} className="w-full sm:w-auto">
            {sending && <Loader2 className="size-4 animate-spin" />}
            Créer ma fiche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
