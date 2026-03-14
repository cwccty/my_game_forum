import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("请输入有效邮箱"),
  nickname: z.string().min(2, "昵称至少 2 个字符").max(20, "昵称最多 20 个字符"),
  password: z.string().min(8, "密码至少 8 位")
});

export const newsPostSchema = z.object({
  title: z.string().min(5, "标题至少 5 个字符"),
  summary: z.string().min(10, "摘要至少 10 个字符"),
  content: z.string().min(30, "正文至少 30 个字符"),
  coverImage: z.string().url("封面图必须是有效 URL").optional().or(z.literal("")),
  categoryId: z.string().min(1, "请选择分类"),
  tagIds: z.array(z.string()).min(1, "至少选择一个标签")
});

export const resourcePostSchema = z.object({
  title: z.string().min(5, "标题至少 5 个字符"),
  summary: z.string().min(10, "摘要至少 10 个字符"),
  description: z.string().min(30, "资源介绍至少 30 个字符"),
  coverImage: z.string().url("封面图必须是有效 URL").optional().or(z.literal("")),
  galleryImages: z.array(z.string().url("截图必须是有效 URL")).optional(),
  externalUrl: z.string().url("下载链接必须是有效 URL"),
  gameName: z.string().min(2, "请填写游戏名称"),
  gameVersion: z.string().min(1, "请填写适配游戏版本"),
  resourceVersion: z.string().optional(),
  categoryId: z.string().min(1, "请选择分类"),
  tagIds: z.array(z.string()).min(1, "至少选择一个标签")
});

export const forumPostSchema = z.object({
  title: z.string().min(5, "标题至少 5 个字符"),
  summary: z.string().min(10, "摘要至少 10 个字符"),
  content: z.string().min(20, "正文至少 20 个字符"),
  categoryId: z.string().min(1, "请选择版块"),
  tagIds: z.array(z.string()).min(1, "至少选择一个标签")
});

export const commentSchema = z.object({
  content: z.string().min(2, "评论至少 2 个字符").max(500, "评论最多 500 个字符")
});

export const reportSchema = z.object({
  reason: z.string().min(4, "举报原因至少 4 个字符").max(200, "举报原因最多 200 个字符")
});
