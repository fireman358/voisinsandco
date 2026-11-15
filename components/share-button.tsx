"use client";

import { useState } from "react";
import { Copy, MessageCircle, MessageSquare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

/**
 * Partage d'une fiche : feuille de partage native si disponible (mobile),
 * sinon menu WhatsApp / Facebook / copier le lien (desktop).
 */
export function ShareButton({ title, text, className }: { title: string; text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();

  const siteUrl = () => (typeof window !== "undefined" ? `${window.location.origin}/` : "");

  const onClick = () => {
    const url = siteUrl();
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      navigator.share({ title, text, url }).catch(() => {
        /* partage annulé */
      });
      return;
    }
    setOpen((v) => !v);
  };

  const whatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${siteUrl()}`)}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  };
  const facebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl())}&quote=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setOpen(false);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${siteUrl()}`);
      toast("Lien copié dans le presse-papiers", "success");
    } catch {
      toast("Copie impossible", "error");
    }
    setOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Button variant="secondary" size="sm" onClick={onClick} aria-label="Partager cette fiche" title="Partager">
        <Share2 className="size-3.5" /> Partager
      </Button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu de partage"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full right-0 z-50 mb-1 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
            <button type="button" onClick={whatsapp} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50">
              <MessageCircle className="size-4 text-green-600" /> WhatsApp
            </button>
            <button type="button" onClick={facebook} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50">
              <MessageSquare className="size-4 text-blue-600" /> Facebook
            </button>
            <button type="button" onClick={copy} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50">
              <Copy className="size-4" /> Copier le lien
            </button>
          </div>
        </>
      )}
    </div>
  );
}
