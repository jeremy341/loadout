import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isReviewHost } from "@/lib/reviewer/host";
import { siteConfig } from "./site-config";

// The reviewer site (review.<domain>) shares this file, since robots.txt is a static path the proxy skips. It is never indexed.
export default async function robots(): Promise<MetadataRoute.Robots> {
  if (isReviewHost((await headers()).get("host"))) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: siteConfig.allowIndexing ? { userAgent: "*", allow: "/" } : { userAgent: "*", disallow: "/" },
    sitemap: siteConfig.allowIndexing ? `${siteConfig.origin}/sitemap.xml` : undefined,
  };
}
