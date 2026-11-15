import type { MetadataRoute } from "next";
import { listAllTowns } from "@/lib/data";
import { slugify } from "@/lib/utils";

const BASE = "https://lebonvoisin.org";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/communes`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/abonnements`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/comment-ca-marche`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/legal`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
  try {
    const towns = await listAllTowns();
    return [
      ...pages,
      ...towns.map((t) => ({
        url: `${BASE}/commune/${slugify(t.town)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return pages;
  }
}
