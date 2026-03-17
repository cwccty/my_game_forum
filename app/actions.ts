"use server";

import { AuditAction, CommentTargetType, ContentStatus, FavoriteTargetType, ReportTargetType } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTurnstileToken } from "@/lib/recaptcha";
import { assertRateLimit } from "@/lib/rate-limit";
import { commentSchema, forumPostSchema, newsPostSchema, registerSchema, reportSchema, resourcePostSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";

const rateLimits = {
  register: { max: 5, windowMs: 10 * 60 * 1000 },
  login: { max: 10, windowMs: 10 * 60 * 1000 },
  submit: { max: 6, windowMs: 10 * 60 * 1000 },
  comment: { max: 10, windowMs: 5 * 60 * 1000 },
  favorite: { max: 30, windowMs: 5 * 60 * 1000 },
  report: { max: 5, windowMs: 10 * 60 * 1000 }
};

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getTagIds(formData: FormData) {
  return formData
    .getAll("tagIds")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);
}

function isCommentTargetType(value: string): value is CommentTargetType {
  return value === "NEWS" || value === "RESOURCE" || value === "FORUM";
}

function isFavoriteTargetType(value: string): value is FavoriteTargetType {
  return value === "NEWS" || value === "RESOURCE";
}

function isReportTargetType(value: string): value is ReportTargetType {
  return value === "NEWS" || value === "RESOURCE" || value === "FORUM" || value === "COMMENT";
}

async function getRequestFingerprint() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  const userAgent = requestHeaders.get("user-agent")?.trim() ?? "unknown-agent";
  const ip = forwardedFor || realIp || "unknown-ip";

  return `${ip}:${userAgent.slice(0, 80)}`;
}

async function applyRateLimit(scope: keyof typeof rateLimits, identity: string) {
  const fingerprint = await getRequestFingerprint();
  assertRateLimit(scope, `${identity}:${fingerprint}`, rateLimits[scope]);
}

async function requireUser() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}

async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return user;
}

type PublishedInteractionTarget = {
  targetPath: string;
  targetType: CommentTargetType | FavoriteTargetType | ReportTargetType;
  targetId: string;
};

async function getPublishedContentTarget(targetType: CommentTargetType | FavoriteTargetType | ReportTargetType, targetId: string): Promise<PublishedInteractionTarget> {
  if (!targetId) {
    throw new Error("目标内容不存在");
  }

  if (targetType === "NEWS") {
    const post = await prisma.newsPost.findFirst({
      where: { id: targetId, status: ContentStatus.PUBLISHED },
      select: { id: true, slug: true }
    });

    if (!post) {
      throw new Error("资讯不存在或未发布");
    }

    return { targetId: post.id, targetType, targetPath: `/news/${post.slug}` };
  }

  if (targetType === "RESOURCE") {
    const post = await prisma.resourcePost.findFirst({
      where: { id: targetId, status: ContentStatus.PUBLISHED },
      select: { id: true, slug: true }
    });

    if (!post) {
      throw new Error("资源不存在或未发布");
    }

    return { targetId: post.id, targetType, targetPath: `/resources/${post.slug}` };
  }

  if (targetType === "FORUM") {
    const post = await prisma.forumPost.findFirst({
      where: { id: targetId, status: ContentStatus.PUBLISHED },
      select: { id: true, slug: true }
    });

    if (!post) {
      throw new Error("帖子不存在或未发布");
    }

    return { targetId: post.id, targetType, targetPath: `/forum/${post.slug}` };
  }

  const comment = await prisma.comment.findFirst({
    where: { id: targetId },
    include: {
      newsPost: { select: { slug: true, status: true } },
      resourcePost: { select: { slug: true, status: true } },
      forumPost: { select: { slug: true, status: true } }
    }
  });

  if (!comment) {
    throw new Error("评论不存在");
  }

  if (comment.newsPost && comment.newsPost.status === ContentStatus.PUBLISHED) {
    return { targetId: comment.id, targetType, targetPath: `/news/${comment.newsPost.slug}` };
  }

  if (comment.resourcePost && comment.resourcePost.status === ContentStatus.PUBLISHED) {
    return { targetId: comment.id, targetType, targetPath: `/resources/${comment.resourcePost.slug}` };
  }

  if (comment.forumPost && comment.forumPost.status === ContentStatus.PUBLISHED) {
    return { targetId: comment.id, targetType, targetPath: `/forum/${comment.forumPost.slug}` };
  }

  throw new Error("评论关联的内容不可交互");
}

export async function registerAction(_: { error?: string } | undefined, formData: FormData) {
  const payload = {
    email: normalizeText(formData.get("email")).toLowerCase(),
    nickname: normalizeText(formData.get("nickname")),
    password: normalizeText(formData.get("password")),
    turnstileToken: normalizeText(formData.get("turnstileToken"))
  };

  try {
    await applyRateLimit("register", payload.email || "anonymous-register");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "操作过于频繁，请稍后再试" };
  }

  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "注册信息无效" };
  }

  const turnstileResult = await verifyTurnstileToken(payload.turnstileToken, "register");

  if (!turnstileResult.ok) {
    return { error: turnstileResult.message };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });

  if (existing) {
    return { error: "该邮箱已被注册" };
  }

  await prisma.user.create({
    data: {
      email: parsed.data.email,
      nickname: parsed.data.nickname,
      passwordHash: hashSync(parsed.data.password, 10)
    }
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/me"
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "注册成功，但自动登录失败，请手动登录。" };
    }

    throw error;
  }

  return {};
}

export async function loginAction(_: { error?: string } | undefined, formData: FormData) {
  const email = normalizeText(formData.get("email")).toLowerCase();
  const password = normalizeText(formData.get("password"));
  const turnstileToken = normalizeText(formData.get("turnstileToken"));

  try {
    await applyRateLimit("login", email || "anonymous-login");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "操作过于频繁，请稍后再试" };
  }

  const turnstileResult = await verifyTurnstileToken(turnstileToken, "login");

  if (!turnstileResult.ok) {
    return { error: turnstileResult.message };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/me"
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "邮箱或密码不正确。" };
    }

    throw error;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function createNewsAction(formData: FormData) {
  const user = await requireUser();
  await applyRateLimit("submit", `user:${user.id}:news`);

  const payload = {
    title: normalizeText(formData.get("title")),
    summary: normalizeText(formData.get("summary")),
    content: normalizeText(formData.get("content")),
    coverImage: normalizeText(formData.get("coverImage")),
    categoryId: normalizeText(formData.get("categoryId")),
    tagIds: getTagIds(formData)
  };

  const parsed = newsPostSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "创建资讯失败");
  }

  await prisma.newsPost.create({
    data: {
      title: parsed.data.title,
      slug: `${slugify(parsed.data.title)}-${Date.now()}`,
      summary: parsed.data.summary,
      content: parsed.data.content,
      coverImage: parsed.data.coverImage || null,
      status: ContentStatus.PENDING,
      authorId: user.id,
      categoryId: parsed.data.categoryId,
      auditLogs: {
        create: {
          action: AuditAction.SUBMIT,
          note: "User submitted news for review."
        }
      },
      tags: {
        create: parsed.data.tagIds.map((tagId) => ({ tagId }))
      }
    }
  });

  revalidatePath("/news");
  revalidatePath("/admin");
  redirect("/me");
}

export async function createResourceAction(formData: FormData) {
  const user = await requireUser();
  await applyRateLimit("submit", `user:${user.id}:resource`);

  const galleryImages = normalizeText(formData.get("galleryImages"))
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const payload = {
    title: normalizeText(formData.get("title")),
    summary: normalizeText(formData.get("summary")),
    description: normalizeText(formData.get("description")),
    coverImage: normalizeText(formData.get("coverImage")),
    galleryImages,
    externalUrl: normalizeText(formData.get("externalUrl")),
    gameName: normalizeText(formData.get("gameName")),
    gameVersion: normalizeText(formData.get("gameVersion")),
    resourceVersion: normalizeText(formData.get("resourceVersion")),
    categoryId: normalizeText(formData.get("categoryId")),
    tagIds: getTagIds(formData)
  };

  const parsed = resourcePostSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "创建资源失败");
  }

  await prisma.resourcePost.create({
    data: {
      title: parsed.data.title,
      slug: `${slugify(parsed.data.title)}-${Date.now()}`,
      summary: parsed.data.summary,
      description: parsed.data.description,
      coverImage: parsed.data.coverImage || null,
      galleryImages: parsed.data.galleryImages ?? [],
      externalUrl: parsed.data.externalUrl,
      gameName: parsed.data.gameName,
      gameVersion: parsed.data.gameVersion,
      resourceVersion: parsed.data.resourceVersion || null,
      status: ContentStatus.PENDING,
      authorId: user.id,
      categoryId: parsed.data.categoryId,
      auditLogs: {
        create: {
          action: AuditAction.SUBMIT,
          note: "User submitted resource for review."
        }
      },
      tags: {
        create: parsed.data.tagIds.map((tagId) => ({ tagId }))
      }
    }
  });

  revalidatePath("/resources");
  revalidatePath("/admin");
  redirect("/me");
}

export async function createForumAction(formData: FormData) {
  const user = await requireUser();
  await applyRateLimit("submit", `user:${user.id}:forum`);

  const payload = {
    title: normalizeText(formData.get("title")),
    summary: normalizeText(formData.get("summary")),
    content: normalizeText(formData.get("content")),
    categoryId: normalizeText(formData.get("categoryId")),
    tagIds: getTagIds(formData)
  };

  const parsed = forumPostSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "创建帖子失败");
  }

  await prisma.forumPost.create({
    data: {
      title: parsed.data.title,
      slug: `${slugify(parsed.data.title)}-${Date.now()}`,
      summary: parsed.data.summary,
      content: parsed.data.content,
      status: ContentStatus.PENDING,
      authorId: user.id,
      categoryId: parsed.data.categoryId,
      auditLogs: {
        create: {
          action: AuditAction.SUBMIT,
          note: "User submitted forum post for review."
        }
      },
      tags: {
        create: parsed.data.tagIds.map((tagId) => ({ tagId }))
      }
    }
  });

  revalidatePath("/forum");
  revalidatePath("/admin");
  redirect("/me");
}

export async function addCommentAction(formData: FormData) {
  const user = await requireUser();
  await applyRateLimit("comment", `user:${user.id}`);

  const content = normalizeText(formData.get("content"));
  const rawTargetType = normalizeText(formData.get("targetType"));
  const rawTargetId = normalizeText(formData.get("targetId"));
  const parsed = commentSchema.safeParse({ content });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "评论失败");
  }

  if (!isCommentTargetType(rawTargetType)) {
    throw new Error("评论目标类型无效");
  }

  const target = await getPublishedContentTarget(rawTargetType, rawTargetId);

  if (target.targetType === "NEWS") {
    await prisma.comment.create({ data: { content: parsed.data.content, targetType: rawTargetType, newsPostId: target.targetId, authorId: user.id } });
    await prisma.newsPost.update({ where: { id: target.targetId }, data: { commentCount: { increment: 1 } } });
  }

  if (target.targetType === "RESOURCE") {
    await prisma.comment.create({ data: { content: parsed.data.content, targetType: rawTargetType, resourcePostId: target.targetId, authorId: user.id } });
    await prisma.resourcePost.update({ where: { id: target.targetId }, data: { commentCount: { increment: 1 } } });
  }

  if (target.targetType === "FORUM") {
    await prisma.comment.create({ data: { content: parsed.data.content, targetType: rawTargetType, forumPostId: target.targetId, authorId: user.id } });
    await prisma.forumPost.update({ where: { id: target.targetId }, data: { commentCount: { increment: 1 } } });
  }

  revalidatePath(target.targetPath);
}

export async function toggleFavoriteAction(formData: FormData) {
  const user = await requireUser();
  await applyRateLimit("favorite", `user:${user.id}`);

  const rawTargetType = normalizeText(formData.get("targetType"));
  const rawTargetId = normalizeText(formData.get("targetId"));

  if (!isFavoriteTargetType(rawTargetType)) {
    throw new Error("收藏目标类型无效");
  }

  const target = await getPublishedContentTarget(rawTargetType, rawTargetId);

  if (target.targetType === "NEWS") {
    const existing = await prisma.favorite.findFirst({ where: { userId: user.id, targetType: rawTargetType, newsPostId: target.targetId } });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      await prisma.newsPost.update({ where: { id: target.targetId }, data: { favoriteCount: { decrement: 1 } } });
    } else {
      await prisma.favorite.create({ data: { userId: user.id, targetType: rawTargetType, newsPostId: target.targetId } });
      await prisma.newsPost.update({ where: { id: target.targetId }, data: { favoriteCount: { increment: 1 } } });
    }
  }

  if (target.targetType === "RESOURCE") {
    const existing = await prisma.favorite.findFirst({ where: { userId: user.id, targetType: rawTargetType, resourcePostId: target.targetId } });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      await prisma.resourcePost.update({ where: { id: target.targetId }, data: { favoriteCount: { decrement: 1 } } });
    } else {
      await prisma.favorite.create({ data: { userId: user.id, targetType: rawTargetType, resourcePostId: target.targetId } });
      await prisma.resourcePost.update({ where: { id: target.targetId }, data: { favoriteCount: { increment: 1 } } });
    }
  }

  revalidatePath(target.targetPath);
  revalidatePath("/me");
}

export async function submitReportAction(formData: FormData) {
  const user = await requireUser();
  await applyRateLimit("report", `user:${user.id}`);

  const reason = normalizeText(formData.get("reason"));
  const rawTargetType = normalizeText(formData.get("targetType"));
  const rawTargetId = normalizeText(formData.get("targetId"));
  const parsed = reportSchema.safeParse({ reason });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "举报失败");
  }

  if (!isReportTargetType(rawTargetType)) {
    throw new Error("举报目标类型无效");
  }

  const target = await getPublishedContentTarget(rawTargetType, rawTargetId);

  const data: {
    reason: string;
    targetType: ReportTargetType;
    userId: string;
    newsPostId?: string;
    resourcePostId?: string;
    forumPostId?: string;
    commentId?: string;
  } = { reason: parsed.data.reason, targetType: rawTargetType, userId: user.id };

  if (target.targetType === "NEWS") data.newsPostId = target.targetId;
  if (target.targetType === "RESOURCE") data.resourcePostId = target.targetId;
  if (target.targetType === "FORUM") data.forumPostId = target.targetId;
  if (target.targetType === "COMMENT") data.commentId = target.targetId;

  await prisma.report.create({ data });
  revalidatePath("/admin");
  revalidatePath(target.targetPath);
}

export async function reviewContentAction(formData: FormData) {
  const admin = await requireAdmin();
  const contentType = normalizeText(formData.get("contentType"));
  const contentId = normalizeText(formData.get("contentId"));
  const action = normalizeText(formData.get("action"));
  const note = normalizeText(formData.get("note"));
  const status = action === "approve" ? ContentStatus.PUBLISHED : action === "reject" ? ContentStatus.REJECTED : ContentStatus.OFFLINE;
  const auditAction = action === "approve" ? AuditAction.APPROVE : action === "reject" ? AuditAction.REJECT : AuditAction.OFFLINE;

  if (contentType === "news") {
    await prisma.newsPost.update({
      where: { id: contentId },
      data: {
        status,
        publishedAt: action === "approve" ? new Date() : undefined,
        rejectReason: action === "reject" ? note || "Rejected by admin." : null,
        auditLogs: { create: { action: auditAction, note, reviewerId: admin.id } }
      }
    });
  }

  if (contentType === "resource") {
    await prisma.resourcePost.update({
      where: { id: contentId },
      data: {
        status,
        publishedAt: action === "approve" ? new Date() : undefined,
        rejectReason: action === "reject" ? note || "Rejected by admin." : null,
        auditLogs: { create: { action: auditAction, note, reviewerId: admin.id } }
      }
    });
  }

  if (contentType === "forum") {
    await prisma.forumPost.update({
      where: { id: contentId },
      data: {
        status,
        publishedAt: action === "approve" ? new Date() : undefined,
        rejectReason: action === "reject" ? note || "Rejected by admin." : null,
        auditLogs: { create: { action: auditAction, note, reviewerId: admin.id } }
      }
    });
  }

  revalidatePath("/admin");
  revalidatePath("/news");
  revalidatePath("/resources");
  revalidatePath("/forum");
}

export async function toggleFeaturedAction(formData: FormData) {
  await requireAdmin();
  const contentId = normalizeText(formData.get("contentId"));
  const current = normalizeText(formData.get("current")) === "true";

  await prisma.resourcePost.update({
    where: { id: contentId },
    data: { featured: !current }
  });

  revalidatePath("/");
  revalidatePath("/resources");
  revalidatePath("/admin");
}




