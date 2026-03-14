import { PrismaClient, UserRole, UserStatus, CategoryType, ContentStatus, AuditAction, CommentTargetType, FavoriteTargetType, ReportTargetType } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();
const isProduction = process.env.NODE_ENV === "production";
const allowDemoSeed = process.env.ALLOW_DEMO_SEED === "true";
const adminEmail = process.env.DEMO_ADMIN_EMAIL ?? "admin@example.com";
const adminPassword = process.env.DEMO_ADMIN_PASSWORD ?? "Admin123456";
const playerEmail = process.env.DEMO_USER_EMAIL ?? "player@example.com";
const playerPassword = process.env.DEMO_USER_PASSWORD ?? "Player123456";

async function main() {
  if (isProduction && !allowDemoSeed) {
    throw new Error("生产环境默认禁止写入演示种子数据。如确需执行，请显式设置 ALLOW_DEMO_SEED=true。");
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      nickname: "站长",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: hashSync(adminPassword, 10)
    },
    create: {
      email: adminEmail,
      passwordHash: hashSync(adminPassword, 10),
      nickname: "站长",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    }
  });

  const player = await prisma.user.upsert({
    where: { email: playerEmail },
    update: {
      nickname: "模组猎人",
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      passwordHash: hashSync(playerPassword, 10)
    },
    create: {
      email: playerEmail,
      passwordHash: hashSync(playerPassword, 10),
      nickname: "模组猎人",
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    }
  });

  const newsCategory = await prisma.category.upsert({
    where: { slug: "industry-news" },
    update: {
      name: "行业资讯",
      description: "游戏动态、更新情报和活动追踪",
      type: CategoryType.NEWS
    },
    create: {
      name: "行业资讯",
      slug: "industry-news",
      description: "游戏动态、更新情报和活动追踪",
      type: CategoryType.NEWS
    }
  });

  const resourceCategory = await prisma.category.upsert({
    where: { slug: "mod-downloads" },
    update: {
      name: "MOD 资源",
      description: "MOD 介绍、安装说明与外部下载链接",
      type: CategoryType.RESOURCE
    },
    create: {
      name: "MOD 资源",
      slug: "mod-downloads",
      description: "MOD 介绍、安装说明与外部下载链接",
      type: CategoryType.RESOURCE
    }
  });

  const forumCategory = await prisma.category.upsert({
    where: { slug: "mod-chat" },
    update: {
      name: "MOD 交流",
      description: "安装问题、兼容讨论与使用心得",
      type: CategoryType.FORUM
    },
    create: {
      name: "MOD 交流",
      slug: "mod-chat",
      description: "安装问题、兼容讨论与使用心得",
      type: CategoryType.FORUM
    }
  });

  const tags = await Promise.all(
    ["动作", "角色扮演", "Slay the Spire 2", "平衡调整", "界面优化"].map((name) =>
      prisma.tag.upsert({
        where: { slug: makeSlug(name) },
        update: { name },
        create: { name, slug: makeSlug(name) }
      })
    )
  );

  const news = await prisma.newsPost.upsert({
    where: { slug: "sts2-first-balance-preview" },
    update: {
      title: "《Slay the Spire 2》首轮平衡预览公开",
      summary: "官方公开了首轮职业平衡方向和地图事件调整重点。",
      content: "本帖用于演示资讯发布与审核流程。正式版本可以接入富文本编辑器、图片上传与更完整的 SEO 配置。",
      coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e",
      status: ContentStatus.PUBLISHED,
      featured: true,
      publishedAt: new Date(),
      authorId: admin.id,
      categoryId: newsCategory.id,
      rejectReason: null
    },
    create: {
      title: "《Slay the Spire 2》首轮平衡预览公开",
      slug: "sts2-first-balance-preview",
      summary: "官方公开了首轮职业平衡方向和地图事件调整重点。",
      content: "本帖用于演示资讯发布与审核流程。正式版本可以接入富文本编辑器、图片上传与更完整的 SEO 配置。",
      coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e",
      status: ContentStatus.PUBLISHED,
      featured: true,
      publishedAt: new Date(),
      authorId: admin.id,
      categoryId: newsCategory.id,
      tags: { create: [{ tagId: tags[2].id }, { tagId: tags[3].id }] },
      auditLogs: { create: [{ action: AuditAction.APPROVE, note: "种子数据初始化通过", reviewerId: admin.id }] }
    }
  });

  const resource = await prisma.resourcePost.upsert({
    where: { slug: "sts2-clean-ui-mod" },
    update: {
      title: "STS2 Clean UI 界面优化包",
      summary: "一个专注于地图、卡牌和状态图标可读性的界面 MOD。",
      description: "本资源帖演示外链式 MOD 发布。站内只保存介绍、标签、版本和外链，不保存实际安装包。",
      coverImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420",
      galleryImages: [
        "https://images.unsplash.com/photo-1511512578047-dfb367046420",
        "https://images.unsplash.com/photo-1542751110-97427bbecf20"
      ],
      externalUrl: "https://example.com/mods/sts2-clean-ui",
      gameName: "Slay the Spire 2",
      gameVersion: "EA 0.1.3",
      resourceVersion: "v1.0.0",
      status: ContentStatus.PUBLISHED,
      featured: true,
      publishedAt: new Date(),
      authorId: player.id,
      categoryId: resourceCategory.id,
      rejectReason: null
    },
    create: {
      title: "STS2 Clean UI 界面优化包",
      slug: "sts2-clean-ui-mod",
      summary: "一个专注于地图、卡牌和状态图标可读性的界面 MOD。",
      description: "本资源帖演示外链式 MOD 发布。站内只保存介绍、标签、版本和外链，不保存实际安装包。",
      coverImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420",
      galleryImages: [
        "https://images.unsplash.com/photo-1511512578047-dfb367046420",
        "https://images.unsplash.com/photo-1542751110-97427bbecf20"
      ],
      externalUrl: "https://example.com/mods/sts2-clean-ui",
      gameName: "Slay the Spire 2",
      gameVersion: "EA 0.1.3",
      resourceVersion: "v1.0.0",
      status: ContentStatus.PUBLISHED,
      featured: true,
      favoriteCount: 1,
      publishedAt: new Date(),
      authorId: player.id,
      categoryId: resourceCategory.id,
      tags: { create: [{ tagId: tags[2].id }, { tagId: tags[4].id }] },
      auditLogs: { create: [{ action: AuditAction.APPROVE, note: "资源描述完整，外链可用", reviewerId: admin.id }] }
    }
  });

  const forum = await prisma.forumPost.upsert({
    where: { slug: "best-mod-load-order-for-sts2" },
    update: {
      title: "你们现在的 STS2 MOD 加载顺序怎么排？",
      summary: "讨论一下 UI、平衡和事件类 MOD 混装时的顺序问题。",
      content: "本帖子用于演示论坛帖子模型、评论与审核后台。后续可以扩展楼中楼、投票和置顶能力。",
      status: ContentStatus.PUBLISHED,
      featured: true,
      publishedAt: new Date(),
      authorId: player.id,
      categoryId: forumCategory.id,
      rejectReason: null
    },
    create: {
      title: "你们现在的 STS2 MOD 加载顺序怎么排？",
      slug: "best-mod-load-order-for-sts2",
      summary: "讨论一下 UI、平衡和事件类 MOD 混装时的顺序问题。",
      content: "本帖子用于演示论坛帖子模型、评论与审核后台。后续可以扩展楼中楼、投票和置顶能力。",
      status: ContentStatus.PUBLISHED,
      featured: true,
      publishedAt: new Date(),
      authorId: player.id,
      categoryId: forumCategory.id,
      tags: { create: [{ tagId: tags[2].id }, { tagId: tags[4].id }] },
      auditLogs: { create: [{ action: AuditAction.APPROVE, note: "讨论内容正常", reviewerId: admin.id }] }
    }
  });

  await prisma.comment.deleteMany({
    where: {
      OR: [{ resourcePostId: resource.id }, { forumPostId: forum.id }]
    }
  });

  await prisma.favorite.deleteMany({
    where: {
      OR: [{ resourcePostId: resource.id }, { newsPostId: news.id }]
    }
  });

  await prisma.report.deleteMany({
    where: {
      resourcePostId: resource.id,
      userId: player.id,
      targetType: ReportTargetType.RESOURCE
    }
  });

  await prisma.comment.createMany({
    data: [
      {
        content: "这个资源帖结构刚好适合整理安装说明。",
        targetType: CommentTargetType.RESOURCE,
        resourcePostId: resource.id,
        authorId: admin.id
      },
      {
        content: "希望后面能加兼容性标签。",
        targetType: CommentTargetType.FORUM,
        forumPostId: forum.id,
        authorId: admin.id
      }
    ]
  });

  await prisma.favorite.createMany({
    data: [
      { targetType: FavoriteTargetType.RESOURCE, userId: admin.id, resourcePostId: resource.id },
      { targetType: FavoriteTargetType.NEWS, userId: player.id, newsPostId: news.id }
    ]
  });

  await prisma.report.create({
    data: {
      reason: "演示举报流程",
      targetType: ReportTargetType.RESOURCE,
      userId: player.id,
      resourcePostId: resource.id
    }
  });

  await prisma.newsPost.update({
    where: { id: news.id },
    data: { favoriteCount: 1, commentCount: 0 }
  });

  await prisma.resourcePost.update({
    where: { id: resource.id },
    data: { favoriteCount: 1, commentCount: 1 }
  });

  await prisma.forumPost.update({
    where: { id: forum.id },
    data: { commentCount: 1 }
  });
}

function makeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "")
    .replace(/-+/g, "-");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
