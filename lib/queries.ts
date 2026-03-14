import { ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const publishedFilter = { status: ContentStatus.PUBLISHED };

async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error("Query failed:", error);
    return fallback;
  }
}

export async function getHomePageData() {
  const [featuredResources, latestNews, hotTopics] = await Promise.all([
    safeQuery(
      () =>
        prisma.resourcePost.findMany({
          where: publishedFilter,
          orderBy: [{ featured: "desc" }, { favoriteCount: "desc" }, { publishedAt: "desc" }],
          take: 6,
          include: {
            author: { select: { nickname: true } },
            category: { select: { name: true, slug: true } },
            tags: { include: { tag: true } }
          }
        }),
      []
    ),
    safeQuery(
      () =>
        prisma.newsPost.findMany({
          where: publishedFilter,
          orderBy: { publishedAt: "desc" },
          take: 6,
          include: {
            author: { select: { nickname: true } },
            category: { select: { name: true, slug: true } }
          }
        }),
      []
    ),
    safeQuery(
      () =>
        prisma.forumPost.findMany({
          where: publishedFilter,
          orderBy: [{ featured: "desc" }, { commentCount: "desc" }, { viewCount: "desc" }],
          take: 6,
          include: {
            author: { select: { nickname: true } },
            category: { select: { name: true, slug: true } }
          }
        }),
      []
    )
  ]);

  return { featuredResources, latestNews, hotTopics };
}

export async function getPublishedNews() {
  return safeQuery(
    () =>
      prisma.newsPost.findMany({
        where: publishedFilter,
        orderBy: { publishedAt: "desc" },
        include: {
          author: { select: { nickname: true } },
          category: { select: { name: true, slug: true } },
          tags: { include: { tag: true } }
        }
      }),
    []
  );
}

export async function getPublishedResources() {
  return safeQuery(
    () =>
      prisma.resourcePost.findMany({
        where: publishedFilter,
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        include: {
          author: { select: { nickname: true } },
          category: { select: { name: true, slug: true } },
          tags: { include: { tag: true } }
        }
      }),
    []
  );
}

export async function getPublishedForumPosts() {
  return safeQuery(
    () =>
      prisma.forumPost.findMany({
        where: publishedFilter,
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        include: {
          author: { select: { nickname: true } },
          category: { select: { name: true, slug: true } },
          tags: { include: { tag: true } }
        }
      }),
    []
  );
}

export async function getNewsDetail(slug: string) {
  return safeQuery(
    () =>
      prisma.newsPost.findFirst({
        where: { slug, ...publishedFilter },
        include: {
          author: { select: { nickname: true } },
          category: { select: { name: true } },
          tags: { include: { tag: true } },
          comments: { orderBy: { createdAt: "desc" }, include: { author: { select: { nickname: true } } } }
        }
      }),
    null
  );
}

export async function getResourceDetail(slug: string) {
  return safeQuery(
    () =>
      prisma.resourcePost.findFirst({
        where: { slug, ...publishedFilter },
        include: {
          author: { select: { nickname: true } },
          category: { select: { name: true } },
          tags: { include: { tag: true } },
          comments: { orderBy: { createdAt: "desc" }, include: { author: { select: { nickname: true } } } }
        }
      }),
    null
  );
}

export async function getForumDetail(slug: string) {
  return safeQuery(
    () =>
      prisma.forumPost.findFirst({
        where: { slug, ...publishedFilter },
        include: {
          author: { select: { nickname: true } },
          category: { select: { name: true } },
          tags: { include: { tag: true } },
          comments: { orderBy: { createdAt: "desc" }, include: { author: { select: { nickname: true } } } }
        }
      }),
    null
  );
}

export async function getSearchResults(keyword: string) {
  if (!keyword) {
    return { news: [], resources: [] };
  }

  const [news, resources] = await Promise.all([
    safeQuery(
      () =>
        prisma.newsPost.findMany({
          where: {
            ...publishedFilter,
            OR: [
              { title: { contains: keyword, mode: "insensitive" } },
              { summary: { contains: keyword, mode: "insensitive" } },
              { tags: { some: { tag: { name: { contains: keyword, mode: "insensitive" } } } } }
            ]
          },
          orderBy: { publishedAt: "desc" },
          include: {
            author: { select: { nickname: true } },
            category: { select: { name: true, slug: true } }
          }
        }),
      []
    ),
    safeQuery(
      () =>
        prisma.resourcePost.findMany({
          where: {
            ...publishedFilter,
            OR: [
              { title: { contains: keyword, mode: "insensitive" } },
              { summary: { contains: keyword, mode: "insensitive" } },
              { gameName: { contains: keyword, mode: "insensitive" } },
              { tags: { some: { tag: { name: { contains: keyword, mode: "insensitive" } } } } }
            ]
          },
          orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
          include: {
            author: { select: { nickname: true } },
            category: { select: { name: true, slug: true } }
          }
        }),
      []
    )
  ]);

  return { news, resources };
}

export async function getPublishMeta() {
  const [categories, tags] = await Promise.all([
    safeQuery(() => prisma.category.findMany({ orderBy: { name: "asc" } }), []),
    safeQuery(() => prisma.tag.findMany({ orderBy: { name: "asc" } }), [])
  ]);

  return { categories, tags };
}

export async function getDashboard(userId: string) {
  const [newsPosts, resourcePosts, forumPosts, favorites] = await Promise.all([
    safeQuery(
      () => prisma.newsPost.findMany({ where: { authorId: userId }, orderBy: { createdAt: "desc" }, include: { category: { select: { name: true } } } }),
      []
    ),
    safeQuery(
      () => prisma.resourcePost.findMany({ where: { authorId: userId }, orderBy: { createdAt: "desc" }, include: { category: { select: { name: true } } } }),
      []
    ),
    safeQuery(
      () => prisma.forumPost.findMany({ where: { authorId: userId }, orderBy: { createdAt: "desc" }, include: { category: { select: { name: true } } } }),
      []
    ),
    safeQuery(
      () => prisma.favorite.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { newsPost: true, resourcePost: true } }),
      []
    )
  ]);

  return { newsPosts, resourcePosts, forumPosts, favorites };
}

export async function getAdminOverview() {
  const [pendingNews, pendingResources, pendingForum, reports, featured] = await Promise.all([
    safeQuery(
      () => prisma.newsPost.findMany({ where: { status: ContentStatus.PENDING }, orderBy: { createdAt: "asc" }, include: { author: { select: { nickname: true } }, category: { select: { name: true } } } }),
      []
    ),
    safeQuery(
      () => prisma.resourcePost.findMany({ where: { status: ContentStatus.PENDING }, orderBy: { createdAt: "asc" }, include: { author: { select: { nickname: true } }, category: { select: { name: true } } } }),
      []
    ),
    safeQuery(
      () => prisma.forumPost.findMany({ where: { status: ContentStatus.PENDING }, orderBy: { createdAt: "asc" }, include: { author: { select: { nickname: true } }, category: { select: { name: true } } } }),
      []
    ),
    safeQuery(
      () => prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { nickname: true } } } }),
      []
    ),
    safeQuery(
      () => prisma.resourcePost.findMany({ where: { status: ContentStatus.PUBLISHED, featured: true }, orderBy: { updatedAt: "desc" }, take: 10 }),
      []
    )
  ]);

  return { pendingNews, pendingResources, pendingForum, reports, featured };
}
