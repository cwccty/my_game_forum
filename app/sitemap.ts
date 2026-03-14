import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/news`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/resources`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/forum`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.3 }
  ];
}
