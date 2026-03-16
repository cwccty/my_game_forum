import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const baseUrl = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/news", "/resources", "/forum", "/search"],
      disallow: ["/admin", "/me", "/submit", "/api"]
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
