import Link from "next/link";
import { cn } from "@/lib/utils";

export function SubmitTabs({ current }: { current: "news" | "resource" | "forum" }) {
  return (
    <div className="tab-row">
      <Link href="/submit/news" className={cn("tab-link", current === "news" && "tab-link-active")}>
        投稿资讯
      </Link>
      <Link href="/submit/resource" className={cn("tab-link", current === "resource" && "tab-link-active")}>
        投稿资源
      </Link>
      <Link href="/submit/forum" className={cn("tab-link", current === "forum" && "tab-link-active")}>
        投稿论坛帖
      </Link>
    </div>
  );
}
