import { reviewContentAction, toggleFeaturedAction } from "@/app/actions";

export function AdminReviewForm({
  contentId,
  contentType,
  currentFeatured
}: {
  contentId: string;
  contentType: "news" | "resource" | "forum";
  currentFeatured?: boolean;
}) {
  return (
    <div className="admin-actions">
      <form action={reviewContentAction} className="inline-form">
        <input type="hidden" name="contentId" value={contentId} />
        <input type="hidden" name="contentType" value={contentType} />
        <input type="hidden" name="action" value="approve" />
        <input name="note" placeholder="审核备注" />
        <button type="submit">通过</button>
      </form>
      <form action={reviewContentAction} className="inline-form">
        <input type="hidden" name="contentId" value={contentId} />
        <input type="hidden" name="contentType" value={contentType} />
        <input type="hidden" name="action" value="reject" />
        <input name="note" placeholder="驳回理由" />
        <button type="submit" className="secondary-button">
          驳回
        </button>
      </form>
      {contentType === "resource" ? (
        <form action={toggleFeaturedAction}>
          <input type="hidden" name="contentId" value={contentId} />
          <input type="hidden" name="current" value={String(currentFeatured ?? false)} />
          <button type="submit" className="ghost-button">
            {currentFeatured ? "取消推荐" : "设为推荐"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
