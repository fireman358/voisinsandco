import type { MetadataRoute } from "next";

// URL de production. Pour un domaine différent, adapte ici ou via env.
const BASE = "https://voisinsandco.edukisto.win";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE}/legal`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
