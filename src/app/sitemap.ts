import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

/**
 * sitemap.xml — the public, indexable surfaces only. Authenticated app
 * routes and user-generated share links are intentionally excluded
 * (they're in robots disallow). Keep this list in sync when adding new
 * marketing/landing pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1.0 },
    { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
    { path: "/sample", changeFrequency: "monthly", priority: 0.8 },
    { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/legal/terms", changeFrequency: "yearly", priority: 0.3 },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
