import { toggleFavoriteAction } from "@/app/actions";

export function FavoriteButton({
  targetId,
  targetType,
  targetPath,
  count
}: {
  targetId: string;
  targetType: "NEWS" | "RESOURCE";
  targetPath: string;
  count: number;
}) {
  return (
    <form action={toggleFavoriteAction}>
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetPath" value={targetPath} />
      <button type="submit" className="secondary-button">
        收藏 {count}
      </button>
    </form>
  );
}
