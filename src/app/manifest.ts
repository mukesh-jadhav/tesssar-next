import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo/site";

/**
 * Web app manifest — enables "Add to Home Screen", a branded splash,
 * and the theme color. Lightweight PWA basics that also feed Google's
 * mobile / installability signals.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.title,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#F6F2E9",
    theme_color: "#E94F20",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
