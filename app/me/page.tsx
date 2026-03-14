import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboard } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "个人中心"
};

export default async function MePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const dashboard = await getDashboard(session.user.id);

  return (
    <section className="content-stack">
      <div className="panel">
        <h1>{session.user.name ?? "用户"} 的个人中心</h1>
        <p className="muted">这里可以查看你的投稿状态和收藏内容。</p>
      </div>
      <div className="grid-2">
        <div className="panel">
          <h2>我的资讯投稿</h2>
          <div className="list-stack">
            {dashboard.newsPosts.length ? dashboard.newsPosts.map((item) => (
              <div key={item.id}><strong>{item.title}</strong><div className="meta-row"><span>{item.category.name}</span><span>{item.status}</span><span>{formatDate(item.createdAt)}</span></div></div>
            )) : <p className="muted">还没有资讯投稿。</p>}
          </div>
        </div>
        <div className="panel">
          <h2>我的资源投稿</h2>
          <div className="list-stack">
            {dashboard.resourcePosts.length ? dashboard.resourcePosts.map((item) => (
              <div key={item.id}><strong>{item.title}</strong><div className="meta-row"><span>{item.category.name}</span><span>{item.status}</span><span>{formatDate(item.createdAt)}</span></div></div>
            )) : <p className="muted">还没有资源投稿。</p>}
          </div>
        </div>
        <div className="panel">
          <h2>我的论坛帖</h2>
          <div className="list-stack">
            {dashboard.forumPosts.length ? dashboard.forumPosts.map((item) => (
              <div key={item.id}><strong>{item.title}</strong><div className="meta-row"><span>{item.category.name}</span><span>{item.status}</span><span>{formatDate(item.createdAt)}</span></div></div>
            )) : <p className="muted">还没有论坛发帖。</p>}
          </div>
        </div>
        <div className="panel">
          <h2>我的收藏</h2>
          <div className="list-stack">
            {dashboard.favorites.length ? dashboard.favorites.map((item) => (
              <div key={item.id}><strong>{item.resourcePost?.title ?? item.newsPost?.title}</strong><div className="meta-row"><span>{item.targetType}</span><span>{formatDate(item.createdAt)}</span></div></div>
            )) : <p className="muted">还没有收藏任何内容。</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
