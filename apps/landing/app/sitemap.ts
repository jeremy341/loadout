import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isReviewHost } from "@/lib/reviewer/host";
import { siteConfig } from "./site-config";

// The reviewer site (review.<domain>) shares this file, since sitemap.xml is a static path the proxy skips. It has no sitemap:
// the answer there is an empty one, so nothing on it is listed.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isReviewHost((await headers()).get("host"))) return [];
  return siteConfig.allowIndexing ? [{ url: `${siteConfig.origin}/`, changeFrequency: "monthly", priority: 1 }] : [];
}
