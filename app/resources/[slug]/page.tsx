import { notFound } from "next/navigation";
import { getResourceDetail } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { CommentForm } from "@/components/comment-form";
import { FavoriteButton } from "@/components/favorite-button";
import { ReportForm } from "@/components/report-form";
import { TagList } from "@/components/tag-list";

export default async function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getResourceDetail(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="panel-grid">
      <article className="panel">
        <p className="eyebrow">{post.gameName}</p>
        <h1>{post.title}</h1>
        <div className="meta-row">
          <span>作者：{post.author.nickname}</span>
          <span>{formatDate(post.publishedAt)}</span>
        </div>
        {post.coverImage ? <img src={post.coverImage} alt={post.title} className="detail-cover" /> : null}
        <p>{post.summary}</p>
        <TagList tags={post.tags.map((item) => item.tag.name)} />
        <div className="panel" style={{ marginTop: 18 }}>
          <div className="meta-row">
            <span>适配版本：{post.gameVersion}</span>
            <span>资源版本：{post.resourceVersion ?? "未标注"}</span>
          </div>
          <p>{post.description}</p>
          <a href={post.externalUrl} target="_blank" rel="noreferrer" className="button-link">前往外部下载</a>
        </div>
      </article>
      <aside className="content-stack">
        <div className="panel">
          <h3>资源互动</h3>
          <div className="button-row">
            <FavoriteButton targetId={post.id} targetType="RESOURCE" targetPath={`/resources/${post.slug}`} count={post.favoriteCount} />
          </div>
        </div>
        <CommentForm targetId={post.id} targetSlug={post.slug} targetType="RESOURCE" targetPath={`/resources/${post.slug}`} />
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
        <ReportForm targetId={post.id} targetType="RESOURCE" targetPath={`/resources/${post.slug}`} />
      </aside>
    </div>
  );
}


