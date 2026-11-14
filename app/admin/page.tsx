"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Copy, KeyRound, Loader2, Mail, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { subcategoryLabel, type Business, type BusinessTier } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Claim {
  id: string;
  businessId: string;
  businessName: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  createdAt: string;
}

const TIERS: { key: BusinessTier; label: string }[] = [
  { key: "standard", label: "Standard" },
  { key: "verified", label: "Vérifiée" },
  { key: "pro", label: "Pro" },
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
      if (res.status === 403) throw new Error("Token invalide ou non configuré (workflow « set-admin-token »)");
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

  const template = TEMPLATES.find((t) => t.key === templateKey) ?? TEMPLATES[0];
  const preview = useMemo(() => fill(template, target, targetClaim), [template, target, targetClaim]);
  const [subjectLine, ...bodyLines] = preview.split("\n\n");
  const mailto = targetClaim?.email
    ? `mailto:${targetClaim.email}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(bodyLines.join("\n\n"))}`
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
        body: JSON.stringify({ to: recipient.trim(), subject: subjectLine, text: bodyLines.join("\n\n") }),
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
          <Link href="/" className="flex items-center gap-1 text-sm font-medium text-forest">
            <ArrowLeft className="size-4" /> Retour à l&apos;appli
          </Link>
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
                          {c.message && <p className="mt-1 text-xs text-neutral-500">{c.message}</p>}
                          <p className="mt-1 text-[11px] text-neutral-400">{new Date(c.createdAt).toLocaleString("fr-BE")}</p>
                        </div>
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
                            {b.town} · {b.tier === "pro" ? "Pack Pro" : "Vérifiée"}
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
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-neutral-50 p-3 text-xs text-neutral-700">
                {preview}
              </pre>
              <div className="flex flex-wrap gap-2">
                {mailto && (
                  <Button asChild size="sm">
                    <a href={mailto}>
                      <Mail className="size-3.5" /> Ouvrir dans ma messagerie
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => copy(preview, "mail")}>
                  <Copy className="size-3.5" /> {copied === "mail" ? "Copié !" : "Copier l'e-mail"}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => copy(bodyLines.join("\n\n"), "wa")}>
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
    </div>
  );
}
