"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Bouton « Installer l'app » (PWA). Utilise le prompt natif quand le navigateur
 * le propose (Chrome/Edge Android & desktop), sinon affiche les instructions
 * (iPhone/iPad, ou navigateur non compatible).
 */
export function InstallAppButton({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (!deferred) {
      alert(
        "Pour installer Voisins & Co :\n\n• Android / Chrome : menu ⋮ → « Installer l'application »\n• iPhone / iPad : bouton Partager (carré avec flèche) → « Sur l'écran d'accueil »\n• Ordinateur : icône d'installation dans la barre d'adresse.",
      );
      return;
    }
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <button
      type="button"
      onClick={install}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold transition-colors",
        className,
      )}
      title="Installer l'application"
    >
      <Download className="size-3.5" /> Installer l&apos;app
    </button>
  );
}
