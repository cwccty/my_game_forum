import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAdminOverview } from "@/lib/queries";
import { AdminReviewForm } from "@/components/admin-review-form";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "管理后台"
};

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const data = await getAdminOverview();

  return (
    <section className="content-stack">
      <div className="panel">
        <h1>管理后台</h1>
        <p className="muted">审核待发布内容、处理举报，并维护首页推荐资源。</p>
      </div>
      <div className="grid-3">
        <div className="panel">
          <h2>待审资讯</h2>
          <div className="list-stack">
            {data.pendingNews.length ? data.pendingNews.map((item) => (
              <div key={item.id}><strong>{item.title}</strong><div className="meta-row"><span>{item.author.nickname}</span><span>{item.category.name}</span></div><AdminReviewForm contentId={item.id} contentType="news" /></div>
            )) : <p className="muted">暂无待审资讯。</p>}
          </div>
        </div>
        <div className="panel">
          <h2>待审资源</h2>
          <div className="list-stack">
            {data.pendingResources.length ? data.pendingResources.map((item) => (
              <div key={item.id}><strong>{item.title}</strong><div className="meta-row"><span>{item.author.nickname}</span><span>{item.category.name}</span></div><AdminReviewForm contentId={item.id} contentType="resource" currentFeatured={item.featured} /></div>
            )) : <p className="muted">暂无待审资源。</p>}
          </div>
        </div>
        <div className="panel">
          <h2>待审论坛帖</h2>
          <div className="list-stack">
            {data.pendingForum.length ? data.pendingForum.map((item) => (
              <div key={item.id}><strong>{item.title}</strong><div className="meta-row"><span>{item.author.nickname}</span><span>{item.category.name}</span></div><AdminReviewForm contentId={item.id} contentType="forum" /></div>
            )) : <p className="muted">暂无待审论坛帖。</p>}
          </div>
        </div>
      </div>
      <div className="grid-2">
        <div className="panel">
          <h2>最新举报</h2>
          <div className="list-stack">
            {data.reports.length ? data.reports.map((item) => (
              <div key={item.id}><strong>{item.targetType}</strong><p>{item.reason}</p><div className="meta-row"><span>{item.user.nickname}</span><span>{formatDate(item.createdAt)}</span></div></div>
            )) : <p className="muted">暂无举报。</p>}
          </div>
        </div>
        <div className="panel">
          <h2>首页推荐资源</h2>
          <div className="list-stack">
            {data.featured.length ? data.featured.map((item) => (
              <div key={item.id}><strong>{item.title}</strong><div className="meta-row"><span>{item.gameName}</span><span>{item.featured ? "推荐中" : "普通"}</span></div><AdminReviewForm contentId={item.id} contentType="resource" currentFeatured={item.featured} /></div>
            )) : <p className="muted">暂无推荐资源。</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
