import Link from "next/link";
import { formatDate } from "@/lib/utils";

type CardProps = {
  href: string;
  title: string;
  summary: string;
  meta: string;
  date?: Date | string | null;
  badge?: string;
};

export function PostCard({ href, title, summary, meta, date, badge }: CardProps) {
  return (
    <article className="card">
      {badge ? <span className="badge">{badge}</span> : null}
      <h3>
        <Link href={href}>{title}</Link>
      </h3>
      <p>{summary}</p>
      <div className="card-meta">
        <span>{meta}</span>
        <span>{formatDate(date)}</span>
      </div>
    </article>
  );
}
