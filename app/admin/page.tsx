"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Loader2, Search } from "lucide-react";
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

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Business[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
      if (res.status === 403) throw new Error("Token invalide ou non configuré (wrangler secret put ADMIN_TOKEN)");
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      return res.json();
    },
    [token],
  );

  const loadClaims = useCallback(async () => {
    setError("");
    try {
      const data = await api<{ claims?: Claim[] }>("/api/admin/claims");
      setClaims(data.claims ?? []);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api]);

  useEffect(() => {
    if (authed) loadClaims();
  }, [authed, loadClaims]);

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

  const setTier = async (id: string, tier: BusinessTier) => {
    setError("");
    try {
      await api("/api/admin/tier", { method: "POST", body: JSON.stringify({ id, tier }) });
      setResults((prev) => prev.map((b) => (b.id === id ? { ...b, tier } : b)));
    } catch (e) {
      setError((e as Error).message);
    }
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
              placeholder="Token ADMIN_TOKEN"
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
                      <p className="font-semibold text-neutral-800">{c.businessName ?? c.businessId}</p>
                      <p className="text-neutral-600">
                        {c.name} — {c.email ?? ""} {c.phone ? `· ${c.phone}` : ""}
                      </p>
                      {c.message && <p className="mt-1 text-xs text-neutral-500">{c.message}</p>}
                      <p className="mt-1 text-[11px] text-neutral-400">{new Date(c.createdAt).toLocaleString("fr-BE")}</p>
                    </li>
                  ))}
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
                            onClick={() => setTier(b.id, t.key)}
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

            <p className="text-center">
              <Badge variant="secondary">Console réservée au gestionnaire</Badge>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
