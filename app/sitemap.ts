import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@prisma/client";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  try {
    const [newsPosts, resourcePosts, forumPosts] = await Promise.all([
      prisma.newsPost.findMany({
        where: { status: ContentStatus.PUBLISHED },
        select: { slug: true, updatedAt: true }
      }),
      prisma.resourcePost.findMany({
        where: { status: ContentStatus.PUBLISHED },
        select: { slug: true, updatedAt: true }
      }),
      prisma.forumPost.findMany({
        where: { status: ContentStatus.PUBLISHED },
        select: { slug: true, updatedAt: true }
      })
    ]);

    return [
      { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
      { url: `${baseUrl}/news`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
      { url: `${baseUrl}/resources`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
      { url: `${baseUrl}/forum`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
      { url: `${baseUrl}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
      ...newsPosts.map((post) => ({
        url: `${baseUrl}/news/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
      ...resourcePosts.map((post) => ({
        url: `${baseUrl}/resources/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
      ...forumPosts.map((post) => ({
        url: `${baseUrl}/forum/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7
      }))
    ];
  } catch (error) {
    console.error("Failed to generate sitemap:", error);

    return [
      { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
      { url: `${baseUrl}/news`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
      { url: `${baseUrl}/resources`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
      { url: `${baseUrl}/forum`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
      { url: `${baseUrl}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.5 }
    ];
  }
}
