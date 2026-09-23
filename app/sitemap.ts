import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/data/categories";
import { AREAS } from "@/lib/data/areas";
import { PROVIDERS } from "@/lib/data/providers";
import { NOW } from "@/lib/data/clock";

const SITE_URL = "https://ghorly.com";

/** Frozen clock, so the sitemap is byte-identical across builds. */
const lastModified = new Date(`${NOW}:00`);

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { path: "/", priority: 1 },
    { path: "/services", priority: 0.9 },
    { path: "/locations", priority: 0.8 },
    { path: "/how-it-works", priority: 0.7 },
    { path: "/for-professionals", priority: 0.7 },
    { path: "/about", priority: 0.5 },
    { path: "/contact", priority: 0.5 },
  ];

  return [
    ...staticRoutes.map((r) => ({
      url: `${SITE_URL}${r.path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: r.priority,
    })),
    ...CATEGORIES.map((c) => ({
      url: `${SITE_URL}/services/${c.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...AREAS.map((a) => ({
      url: `${SITE_URL}/locations/${a.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...PROVIDERS.map((p) => ({
      url: `${SITE_URL}/providers/${p.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
