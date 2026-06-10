import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

/**
 * robots.txt — allow the public marketing surfaces, keep the
 * authenticated app, API, and admin out of the index. The auth-gated
 * routes redirect to /login for anonymous crawlers anyway; disallowing
 * them avoids wasted crawl budget and stray thin pages.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/dashboard",
          "/history",
          "/new",
          "/studio",
          "/studies",
          "/architecture/",
          "/r/",
          "/login",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
