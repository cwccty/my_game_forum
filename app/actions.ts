"use server";

import { AuditAction, CommentTargetType, ContentStatus, FavoriteTargetType, ReportTargetType } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { commentSchema, forumPostSchema, newsPostSchema, registerSchema, reportSchema, resourcePostSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getTagIds(formData: FormData) {
  return formData
    .getAll("tagIds")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);
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

export async function registerAction(_: { error?: string } | undefined, formData: FormData) {
  const payload = {
    email: normalizeText(formData.get("email")),
    nickname: normalizeText(formData.get("nickname")),
    password: normalizeText(formData.get("password"))
  };

  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "注册信息无效" };
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

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/me"
  });

  return {};
}

export async function loginAction(formData: FormData) {
  await signIn("credentials", {
    email: normalizeText(formData.get("email")),
    password: normalizeText(formData.get("password")),
    redirectTo: "/me"
  });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function createNewsAction(formData: FormData) {
  const user = await requireUser();
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
    throw new Error(parsed.error.issues[0]?.message ?? "Failed to create news post.");
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
    throw new Error(parsed.error.issues[0]?.message ?? "Failed to create resource post.");
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
  const payload = {
    title: normalizeText(formData.get("title")),
    summary: normalizeText(formData.get("summary")),
    content: normalizeText(formData.get("content")),
    categoryId: normalizeText(formData.get("categoryId")),
    tagIds: getTagIds(formData)
  };

  const parsed = forumPostSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Failed to create forum post.");
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
  const content = normalizeText(formData.get("content"));
  const targetType = normalizeText(formData.get("targetType")) as CommentTargetType;
  const targetId = normalizeText(formData.get("targetId"));
  const targetPath = normalizeText(formData.get("targetPath"));
  const parsed = commentSchema.safeParse({ content });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Failed to comment.");
  }

  if (targetType === "NEWS") {
    await prisma.comment.create({ data: { content: parsed.data.content, targetType, newsPostId: targetId, authorId: user.id } });
    await prisma.newsPost.update({ where: { id: targetId }, data: { commentCount: { increment: 1 } } });
  }

  if (targetType === "RESOURCE") {
    await prisma.comment.create({ data: { content: parsed.data.content, targetType, resourcePostId: targetId, authorId: user.id } });
    await prisma.resourcePost.update({ where: { id: targetId }, data: { commentCount: { increment: 1 } } });
  }

  if (targetType === "FORUM") {
    await prisma.comment.create({ data: { content: parsed.data.content, targetType, forumPostId: targetId, authorId: user.id } });
    await prisma.forumPost.update({ where: { id: targetId }, data: { commentCount: { increment: 1 } } });
  }

  revalidatePath(targetPath);
}

export async function toggleFavoriteAction(formData: FormData) {
  const user = await requireUser();
  const targetType = normalizeText(formData.get("targetType")) as FavoriteTargetType;
  const targetId = normalizeText(formData.get("targetId"));
  const targetPath = normalizeText(formData.get("targetPath"));

  if (targetType === "NEWS") {
    const existing = await prisma.favorite.findFirst({ where: { userId: user.id, targetType, newsPostId: targetId } });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      await prisma.newsPost.update({ where: { id: targetId }, data: { favoriteCount: { decrement: 1 } } });
    } else {
      await prisma.favorite.create({ data: { userId: user.id, targetType, newsPostId: targetId } });
      await prisma.newsPost.update({ where: { id: targetId }, data: { favoriteCount: { increment: 1 } } });
    }
  }

  if (targetType === "RESOURCE") {
    const existing = await prisma.favorite.findFirst({ where: { userId: user.id, targetType, resourcePostId: targetId } });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      await prisma.resourcePost.update({ where: { id: targetId }, data: { favoriteCount: { decrement: 1 } } });
    } else {
      await prisma.favorite.create({ data: { userId: user.id, targetType, resourcePostId: targetId } });
      await prisma.resourcePost.update({ where: { id: targetId }, data: { favoriteCount: { increment: 1 } } });
    }
  }

  revalidatePath(targetPath);
  revalidatePath("/me");
}

export async function submitReportAction(formData: FormData) {
  const user = await requireUser();
  const reason = normalizeText(formData.get("reason"));
  const targetType = normalizeText(formData.get("targetType")) as ReportTargetType;
  const targetId = normalizeText(formData.get("targetId"));
  const targetPath = normalizeText(formData.get("targetPath"));
  const parsed = reportSchema.safeParse({ reason });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Failed to submit report.");
  }

  const data: {
    reason: string;
    targetType: ReportTargetType;
    userId: string;
    newsPostId?: string;
    resourcePostId?: string;
    forumPostId?: string;
    commentId?: string;
  } = { reason: parsed.data.reason, targetType, userId: user.id };

  if (targetType === "NEWS") data.newsPostId = targetId;
  if (targetType === "RESOURCE") data.resourcePostId = targetId;
  if (targetType === "FORUM") data.forumPostId = targetId;
  if (targetType === "COMMENT") data.commentId = targetId;

  await prisma.report.create({ data });
  revalidatePath("/admin");
  revalidatePath(targetPath);
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

