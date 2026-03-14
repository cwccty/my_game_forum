import { submitReportAction } from "@/app/actions";

export function ReportForm({
  targetId,
  targetType,
  targetPath
}: {
  targetId: string;
  targetType: "NEWS" | "RESOURCE" | "FORUM";
  targetPath: string;
}) {
  return (
    <form action={submitReportAction} className="panel form-stack">
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetPath" value={targetPath} />
      <h3>举报内容</h3>
      <textarea name="reason" rows={3} placeholder="例如：链接失效、搬运未注明来源、内容不准确" required />
      <button type="submit" className="secondary-button">
        提交举报
      </button>
    </form>
  );
}
