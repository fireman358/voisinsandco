"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Copy, KeyRound, Loader2, Mail, MessageSquare, Pencil, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { subcategoryLabel, type Business, type BusinessTier } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Claim {
  id: string;
  businessId: string;
  businessName: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  bce: string | null;
  message: string | null;
  createdAt: string;
}

const TIERS: { key: BusinessTier; label: string }[] = [
  { key: "standard", label: "Standard" },
  { key: "verified", label: "Vérifiée" },
  { key: "visibility", label: "Visibilité (9 €)" },
  { key: "pro", label: "Pro (29 €)" },
];

interface Template {
  key: string;
  label: string;
  subject: string;
  body: string;
}

const TEMPLATES: Template[] = [
  {
    key: "verified",
    label: "Fiche vérifiée (gratuit)",
    subject: "Votre fiche {business} est vérifiée sur Voisins & Co",
    body:
      "Bonjour {name},\n\nBonne nouvelle : votre fiche « {business} » ({town}) est maintenant VÉRIFIÉE sur Voisins & Co. Vos clients du quartier la voient avec le badge vert, plus rassurant qu'une fiche standard.\n\nSouhaitez-vous aller plus loin ? Le Pack Visibilité (9 €/mois, sans engagement) vous permet de mettre à jour vos horaires, ajouter une photo de vitrine et publier vos actualités.\n\nPaiement simple par virement (unique, permanent ou annuel : 12 mois pour le prix de 10) ; je vous envoie le QR code dès confirmation.\n\nÀ bientôt,\nDavid — Edukisto, éditeur de Voisins & Co\nhttps://edukisto.win",
  },
  {
    key: "visibilite",
    label: "Pack Visibilité activé (9 €/mois)",
    subject: "Pack Visibilité activé pour {business} — Voisins & Co",
    body:
      "Bonjour {name},\n\nVotre Pack Visibilité est activé jusqu'au {until} pour « {business} » ({town}).\n\nVous pouvez maintenant :\n- mettre à jour vos horaires d'ouverture ;\n- ajouter une photo de votre vitrine ;\n- publier vos actualités (fermeture, promo, nouveau produit).\n\nMontant : 9 €/mois — virement au compte communiqué, en indiquant « VC-{business} » en communication. Le QR code de paiement est en pièce jointe.\n\nMerci et à bientôt,\nDavid — Edukisto\nhttps://edukisto.win",
  },
  {
    key: "pro",
    label: "Pack Pro activé (29 €/mois)",
    subject: "Pack Pro activé pour {business} — Voisins & Co",
    body:
      "Bonjour {name},\n\nVotre Pack Pro est activé jusqu'au {until} pour « {business} » ({town}).\n\nVotre fiche profite de :\n- lien cliquable vers votre site / Facebook / module de réservation ;\n- publication d'actus et d'offres flash auprès des voisins à 10 km ;\n- mise en avant en tête de liste dans votre catégorie ;\n- badge « Pro » bleu.\n\nMontant : 29 €/mois — virement avec la communication « VC-{business} ». Pensez à la formule annuelle : 12 mois pour le prix de 10.\n\nMerci,\nDavid — Edukisto\nhttps://edukisto.win",
  },
  {
    key: "echeance",
    label: "Rappel d'échéance (J-7)",
    subject: "Votre abonnement Voisins & Co arrive à échéance le {until}",
    body:
      "Bonjour {name},\n\nPetit rappel : votre abonnement pour « {business} » ({town}) arrive à échéance le {until}.\n\nPour ne rien perdre de votre visibilité, renouvelez par virement (unique ou permanent) avec la communication « VC-{business} ». Le QR code est à nouveau en pièce jointe.\n\nMerci,\nDavid — Edukisto\nhttps://edukisto.win",
  },
  {
    key: "retard",
    label: "Relance après échéance",
    subject: "Votre fiche {business} sur Voisins & Co — renouvellement",
    body:
      "Bonjour {name},\n\nVotre abonnement pour « {business} » ({town}) a pris fin le {until}. Votre fiche est revenue en « Vérifiée » : le badge reste, mais plus de mise en avant ni d'actus.\n\nUn simple virement suffit pour réactiver le pack — ou passez à la formule annuelle (12 mois pour le prix de 10).\n\nDavid — Edukisto\nhttps://edukisto.win",
  },
  {
    key: "qr",
    label: "Envoi QR code de paiement",
    subject: "QR code de paiement — Voisins & Co",
    body:
      "Bonjour {name},\n\nComme convenu, voici le QR code de virement pour « {business} » ({town}). Scannez-le avec votre appli bancaire (ou Payconiq) : le montant et la communication sont pré-remplis.\n\nAstuce : dans votre appli bancaire, vous pouvez aussi régler ce virement de façon permanente — il s'exécutera chaque mois sans y penser.\n\nDès réception, j'active votre pack.\n\nDavid — Edukisto\nhttps://edukisto.win",
  },
];

function daysUntil(dateIso: string | null | undefined): number | null {
  if (!dateIso) return null;
  const d = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

function fill(t: Template, b: Business | null, claim?: Claim | null): string {
  const name = claim?.name ?? "chère cliente, cher client";
  const map: Record<string, string> = {
    "{name}": name,
    "{business}": b?.name ?? "…",
    "{town}": b?.town ?? "…",
    "{until}": b?.paidUntil ?? "…",
  };
  return Object.entries(map).reduce((acc, [k, v]) => acc.replaceAll(k, v), `${t.subject}\n\n${t.body}`);
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [subs, setSubs] = useState<Business[]>([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Business[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [templateKey, setTemplateKey] = useState(TEMPLATES[0].key);
  const [target, setTarget] = useState<Business | null>(null);
  const [targetClaim, setTargetClaim] = useState<Claim | null>(null);
  const [copied, setCopied] = useState("");
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin-token");
    if (saved) {
      setToken(saved);
      setAuthed(true);
    }
  }, []);

  const api = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const res = await fetch(path, {
        ...init,
        headers: { "x-admin-token": token, "Content-Type": "application/json", ...(init?.headers ?? {}) },
      });
      if (res.status === 403) throw new Error("Mot de passe incorrect, ou ADMIN_TOKEN non encore configuré : ajoute le secret GitHub ADMIN_PASSWORD puis lance le workflow « Définit le mot de passe admin ».");
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      return res.json();
    },
    [token],
  );

  const loadAll = useCallback(async () => {
    setError("");
    try {
      const [c, s] = await Promise.all([
        api<{ claims?: Claim[] }>("/api/admin/claims"),
        api<{ items?: Business[] }>("/api/admin/subscriptions"),
      ]);
      setClaims(c.claims ?? []);
      setSubs(s.items ?? []);
    } catch (e) {
      setError((e as Error).message);
      setClaims([]);
      setSubs([]);
    }
  }, [api]);

  useEffect(() => {
    if (authed) loadAll();
  }, [authed, loadAll]);

  const search = async () => {
    if (q.trim().length < 2) return;
    setBusy(true);
    setError("");
    try {
      const data = await api<{ items?: Business[] }>(
        `/api/admin/businesses?q=${encodeURIComponent(q.trim())}`,
      );
      setResults(data.items ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const saveTier = async (b: Business, tier: BusinessTier, paidUntil: string | null) => {
    setError("");
    try {
      await api("/api/admin/tier", {
        method: "POST",
        body: JSON.stringify({ id: b.id, tier, paidUntil: paidUntil || null }),
      });
      const patch = (x: Business) => (x.id === b.id ? { ...x, tier, paidUntil: paidUntil || null } : x);
      setResults((prev) => prev.map(patch));
      setSubs((prev) => prev.map(patch));
      if (tier === "standard") setSubs((prev) => prev.filter((x) => x.id !== b.id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const removeClaim = async (id: string) => {
    setError("");
    try {
      await api("/api/admin/claims", { method: "DELETE", body: JSON.stringify({ id }) });
      setClaims((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const [editTarget, setEditTarget] = useState<Business | null>(null);
  const [fPhone, setFPhone] = useState("");
  const [fWebsite, setFWebsite] = useState("");
  const [fHours, setFHours] = useState("");
  const [fNews, setFNews] = useState("");
  const openEdit = (b: Business) => {
    setEditTarget(b);
    setFPhone(b.phone ?? "");
    setFWebsite(b.website ?? "");
    setFHours(b.hours ?? "");
    setFNews(b.news ?? "");
  };
  const saveDetails = async () => {
    if (!editTarget) return;
    setError("");
    try {
      await api("/api/admin/businesses", {
        method: "PATCH",
        body: JSON.stringify({
          id: editTarget.id,
          phone: fPhone,
          website: fWebsite,
          hours: fHours,
          news: fNews,
        }),
      });
      const patch = (x: Business): Business =>
        x.id === editTarget.id
          ? { ...x, phone: fPhone || undefined, website: fWebsite || undefined, hours: fHours || undefined, news: fNews || undefined }
          : x;
      setResults((prev) => prev.map(patch));
      setSubs((prev) => prev.map(patch));
      setEditTarget(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const template = TEMPLATES.find((t) => t.key === templateKey) ?? TEMPLATES[0];
  const preview = useMemo(() => fill(template, target, targetClaim), [template, target, targetClaim]);
  const [subjectLine, ...bodyLines] = preview.split("\n\n");
  const [editSubject, setEditSubject] = useState<string | null>(null);
  const [editBody, setEditBody] = useState<string | null>(null);
  useEffect(() => {
    setEditSubject(null);
    setEditBody(null);
  }, [templateKey, target?.id, targetClaim?.id]);
  const finalSubject = editSubject ?? subjectLine;
  const finalBody = editBody ?? bodyLines.join("\n\n");
  const mailto = (targetClaim?.email || recipient).includes("@")
    ? `mailto:${targetClaim?.email || recipient}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`
    : null;

  const copy = async (text: string, what: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(""), 1500);
  };

  const sendEmail = async () => {
    if (!recipient.trim().includes("@")) {
      setError("Renseigne une adresse e-mail valide.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await api("/api/admin/send-email", {
        method: "POST",
        body: JSON.stringify({ to: recipient.trim(), subject: finalSubject, text: finalBody }),
      });
      setCopied("sent");
      setTimeout(() => setCopied(""), 2500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const pickTarget = (b: Business | null, c: Claim | null = null) => {
    setTarget(b);
    setTargetClaim(c);
    setRecipient(c?.email ?? "");
  };

  return (
    <div className="min-h-dvh bg-paper px-4 py-6">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-neutral-900">Console Voisins &amp; Co</h1>
          <div className="flex items-center gap-3">
            {authed && (
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("admin-token");
                  setAuthed(false);
                  setToken("");
                }}
                className="text-xs font-medium text-neutral-400 underline hover:text-accent-dark"
              >
                Se déconnecter
              </button>
            )}
            <Link href="/" className="flex items-center gap-1 text-sm font-medium text-forest">
              <ArrowLeft className="size-4" /> Retour à l&apos;appli
            </Link>
          </div>
        </div>

        {!authed ? (
          <div className="mx-auto max-w-sm space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <KeyRound className="size-4 text-forest" /> Accès administrateur
            </div>
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Mot de passe admin"
            />
            <Button
              className="w-full"
              onClick={() => {
                localStorage.setItem("admin-token", token);
                setAuthed(true);
              }}
              disabled={!token.trim()}
            >
              Se connecter
            </Button>
          </div>
        ) : (
          <>
            {error && <p className="rounded-lg bg-accent-light px-3 py-2 text-xs text-accent-dark">{error}</p>}

            <section className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-4">
              <h2 className="text-sm font-bold text-neutral-900">Revendications reçues ({claims?.length ?? 0})</h2>
              {!claims ? (
                <p className="flex items-center gap-2 text-sm text-neutral-400"><Loader2 className="size-4 animate-spin" /> Chargement…</p>
              ) : claims.length === 0 ? (
                <p className="text-sm text-neutral-500">Aucune revendication pour le moment.</p>
              ) : (
                <ul className="space-y-2">
                  {claims.map((c) => (
                    <li key={c.id} className="rounded-xl border border-neutral-200 p-3 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-neutral-800">{c.businessName ?? c.businessId}</p>
                          <p className="text-neutral-600">
                            {c.name} — {c.email ?? ""} {c.phone ? `· ${c.phone}` : ""}
                          </p>
                          {c.bce && (
                            <p className="mt-1 text-xs">
                              BCE&nbsp;
                              <a
                                href={`https://kbopub.economie.fgov.be/etrade/enterprise/search?enterpriseNumber=${encodeURIComponent(c.bce)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-accent-dark underline"
                              >
                                {c.bce} — vérifier sur le registre officiel ↗
                              </a>
                            </p>
                          )}
                          {c.message && <p className="mt-1 text-xs text-neutral-500">{c.message}</p>}
                          <p className="mt-1 text-[11px] text-neutral-400">{new Date(c.createdAt).toLocaleString("fr-BE")}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const b = subs.find((x) => x.id === c.businessId) ?? results.find((x) => x.id === c.businessId) ?? null;
                              pickTarget(b, c);
                              setTemplateKey("verified");
                            }}
                          >
                            <Mail className="size-3.5" /> Répondre
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            title="Supprimer cette demande"
                            onClick={() => removeClaim(c.id)}
                          >
                            <Trash2 className="size-3.5 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                <CalendarClock className="size-4 text-forest" /> Abonnements ({subs.length})
              </h2>
              {subs.length === 0 ? (
                <p className="text-sm text-neutral-500">Aucun pack actif — active un pack via la recherche ci-dessous.</p>
              ) : (
                <ul className="space-y-2">
                  {subs.map((b) => {
                    const d = daysUntil(b.paidUntil);
                    return (
                      <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 p-3 text-sm">
                        <div>
                          <p className="font-semibold text-neutral-800">{b.name}</p>
                          <p className="text-xs text-neutral-500">
                            {b.town} · {b.tier === "pro" ? "Pack Pro" : b.tier === "visibility" ? "Pack Visibilité" : b.tier === "verified" ? "Vérifiée" : "Standard"}
                            {b.paidUntil ? ` · jusqu'au ${b.paidUntil}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {d !== null && d < 0 ? (
                            <Badge variant="amber">Expiré</Badge>
                          ) : d !== null && d <= 7 ? (
                            <Badge variant="amber">Échoit dans {d} j</Badge>
                          ) : (
                            <Badge variant="secondary">Actif</Badge>
                          )}
                          <input
                            type="date"
                            value={b.paidUntil ?? ""}
                            onChange={(e) => saveTier(b, b.tier, e.target.value || null)}
                            className="h-8 rounded-lg border border-neutral-200 px-2 text-xs"
                            aria-label={`Échéance ${b.name}`}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              pickTarget(b);
                              setTemplateKey(d !== null && d < 0 ? "retard" : d !== null && d <= 7 ? "echeance" : b.tier === "pro" ? "pro" : "visibilite");
                            }}
                          >
                            <Mail className="size-3.5" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
              <h2 className="text-sm font-bold text-neutral-900">Gérer une fiche</h2>
              <div className="flex gap-2">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom du commerce ou ville…" />
                <Button onClick={search} disabled={busy || q.trim().length < 2}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                </Button>
              </div>
              {results.length > 0 && (
                <ul className="space-y-2">
                  {results.map((b) => (
                    <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 p-3 text-sm">
                      <div>
                        <p className="font-semibold text-neutral-800">{b.name}</p>
                        <p className="text-xs text-neutral-500">
                          {b.town} {b.subcategory ? `· ${subcategoryLabel(b.subcategory)}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(b)}>
                          <Pencil className="size-3.5" /> Modifier
                        </Button>
                        {TIERS.map((t) => (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => saveTier(b, t.key, b.paidUntil ?? null)}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs font-medium",
                              b.tier === t.key
                                ? "border-forest bg-forest text-white"
                                : "border-neutral-200 bg-white text-neutral-600 hover:border-forest/40",
                            )}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
              <h2 className="text-sm font-bold text-neutral-900">Canevas d&apos;e-mails &amp; messages</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={templateKey}
                  onChange={(e) => setTemplateKey(e.target.value)}
                  className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                  aria-label="Modèle de message"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
                <select
                  value={target?.id ?? ""}
                  onChange={(e) => {
                    pickTarget(
                      subs.find((x) => x.id === e.target.value) ?? results.find((x) => x.id === e.target.value) ?? null,
                    );
                  }}
                  className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                  aria-label="Fiche concernée"
                >
                  <option value="">Choisir une fiche…</option>
                  {[...subs, ...results.filter((r) => !subs.some((s) => s.id === r.id))].map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.town})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="destinataire@exemple.be"
                  aria-label="Destinataire"
                />
                <Button onClick={sendEmail} disabled={sending || !recipient.trim()} className="whitespace-nowrap">
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  {copied === "sent" ? "Envoyé !" : "Envoyer"}
                </Button>
              </div>
              <div className="space-y-2">
                <Input
                  value={finalSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  aria-label="Objet de l'e-mail (modifiable)"
                  className="text-sm font-medium"
                />
                <textarea
                  value={finalBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  aria-label="Corps de l'e-mail (modifiable)"
                  className="h-56 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    setEditSubject(null);
                    setEditBody(null);
                  }}
                  className="text-xs font-medium text-forest underline"
                >
                  Réinitialiser le canevas
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {mailto && (
                  <Button asChild size="sm">
                    <a href={mailto}>
                      <Mail className="size-3.5" /> Ouvrir dans ma messagerie
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => copy(`${finalSubject}\n\n${finalBody}`, "mail")}>
                  <Copy className="size-3.5" /> {copied === "mail" ? "Copié !" : "Copier l'e-mail"}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => copy(finalBody, "wa")}>
                  <MessageSquare className="size-3.5" /> {copied === "wa" ? "Copié !" : "Copier pour WhatsApp"}
                </Button>
              </div>
            </section>

            <p className="text-center">
              <Badge variant="secondary">Console réservée au gestionnaire</Badge>
            </p>
          </>
        )}
      </div>

      <Dialog open={editTarget !== null} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier « {editTarget?.name} »</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="f-phone">Téléphone (visible dès Vérifiée)</Label>
              <Input id="f-phone" value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="+32 67 …" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-website">Site web (Pack Pro uniquement)</Label>
              <Input id="f-website" value={fWebsite} onChange={(e) => setFWebsite(e.target.value)} placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-hours">Horaires (Pack Visibilité)</Label>
              <Input id="f-hours" value={fHours} onChange={(e) => setFHours(e.target.value)} placeholder="Lu-Ve 09:00-18:00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-news">Actu / offre flash (Pack Pro)</Label>
              <Input id="f-news" value={fNews} onChange={(e) => setFNews(e.target.value)} placeholder="Pain au levain chaud dès 16h" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setEditTarget(null)}>Annuler</Button>
              <Button size="sm" onClick={saveDetails}>Enregistrer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
