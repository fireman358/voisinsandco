import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Space_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/toast";
import { PwaRegister } from "@/components/pwa-register";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lebonvoisin.org"),
  title: "Le Bon Voisin — Économie locale & entraide de voisinage",
  description:
    "Annuaire des commerces et artisans, bons plans anti-gaspi, mur des besoins et boîte à outils du quartier autour d'Arquennes, Seneffe, Nivelles et Lillois.",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "fr_BE",
    url: "/",
    siteName: "Le Bon Voisin",
    title: "Le Bon Voisin — Économie locale & entraide",
    description:
      "Commerces et artisans, bons plans anti-gaspi, mur des besoins et boîte à outils du quartier.",
  },
  twitter: {
    card: "summary",
    title: "Le Bon Voisin — Économie locale & entraide",
    description:
      "Commerces et artisans, bons plans anti-gaspi, mur des besoins et boîte à outils du quartier.",
  },
  appleWebApp: {
    capable: true,
    title: "Le Bon Voisin",
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
    <html lang="fr" className={`${bricolage.variable} ${spaceMono.variable}`}>
      <body className="bg-paper font-sans text-neutral-900 antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var s=localStorage.getItem('voisins-font-size');if(s!=='sm'&&s!=='md'&&s!=='lg')s='md';document.documentElement.dataset.fontSize=s;}catch(e){}",
          }}
        />
        <ToastProvider>{children}</ToastProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
