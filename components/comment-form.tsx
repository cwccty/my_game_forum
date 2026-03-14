import { addCommentAction } from "@/app/actions";

export function CommentForm({
  targetId,
  targetSlug,
  targetType,
  targetPath
}: {
  targetId: string;
  targetSlug: string;
  targetType: "NEWS" | "RESOURCE" | "FORUM";
  targetPath: string;
}) {
  return (
    <form action={addCommentAction} className="panel form-stack">
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="targetSlug" value={targetSlug} />
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetPath" value={targetPath} />
      <h3>发表评论</h3>
      <textarea name="content" rows={4} placeholder="补充你的看法、兼容性说明或使用反馈" required />
      <button type="submit">提交评论</button>
    </form>
  );
}
