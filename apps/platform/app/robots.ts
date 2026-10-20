import type { MetadataRoute } from "next";

// The platform preview is not for search engines.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
