import type { MetadataRoute } from "next";
import { siteConfig } from "./site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return siteConfig.allowIndexing ? [{ url: `${siteConfig.origin}/`, changeFrequency: "monthly", priority: 1 }] : [];
}
