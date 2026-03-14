import { notFound } from "next/navigation";
import { getNewsDetail } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { CommentForm } from "@/components/comment-form";
import { FavoriteButton } from "@/components/favorite-button";
import { ReportForm } from "@/components/report-form";
import { TagList } from "@/components/tag-list";

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getNewsDetail(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="panel-grid">
      <article className="panel">
        <p className="eyebrow">{post.category.name}</p>
        <h1>{post.title}</h1>
        <div className="meta-row">
          <span>作者：{post.author.nickname}</span>
          <span>{formatDate(post.publishedAt)}</span>
        </div>
        {post.coverImage ? <img src={post.coverImage} alt={post.title} className="detail-cover" /> : null}
        <p>{post.summary}</p>
        <TagList tags={post.tags.map((item) => item.tag.name)} />
        <div className="detail-content">{post.content}</div>
      </article>
      <aside className="content-stack">
        <div className="panel">
          <h3>互动</h3>
          <div className="button-row">
            <FavoriteButton targetId={post.id} targetType="NEWS" targetPath={`/news/${post.slug}`} count={post.favoriteCount} />
          </div>
        </div>
        <CommentForm targetId={post.id} targetSlug={post.slug} targetType="NEWS" targetPath={`/news/${post.slug}`} />
        <div className="panel">
          <h3>评论区</h3>
          <div className="list-stack">
            {post.comments.length ? post.comments.map((comment) => (
              <div key={comment.id}>
                <strong>{comment.author.nickname}</strong>
                <p>{comment.content}</p>
              </div>
            )) : <p className="muted">暂时还没有评论。</p>}
          </div>
        </div>
        <ReportForm targetId={post.id} targetType="NEWS" targetPath={`/news/${post.slug}`} />
      </aside>
    </div>
  );
}


