import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ToastProvider } from "@/components/toast";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  metadataBase: new URL("https://voisinsandco.edukisto.win"),
  title: "Voisins & Co — Économie locale & entraide de voisinage",
  description:
    "Annuaire des commerces et artisans, bons plans anti-gaspi, mur des besoins et boîte à outils du quartier autour d'Arquennes, Seneffe, Nivelles et Lillois.",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "fr_BE",
    url: "/",
    siteName: "Voisins & Co",
    title: "Voisins & Co — Économie locale & entraide",
    description:
      "Commerces et artisans, bons plans anti-gaspi, mur des besoins et boîte à outils du quartier.",
  },
  twitter: {
    card: "summary",
    title: "Voisins & Co — Économie locale & entraide",
    description:
      "Commerces et artisans, bons plans anti-gaspi, mur des besoins et boîte à outils du quartier.",
  },
  appleWebApp: {
    capable: true,
    title: "Voisins & Co",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15803D",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-paper font-sans text-neutral-900 antialiased">
        <ToastProvider>{children}</ToastProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
