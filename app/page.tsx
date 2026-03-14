import Link from "next/link";
import { getHomePageData } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { PostCard } from "@/components/post-card";
import { SectionHeader } from "@/components/section-header";
import { TagList } from "@/components/tag-list";

export default async function HomePage() {
  const { featuredResources, latestNews, hotTopics } = await getHomePageData();

  return (
    <div className="content-stack">
      <section className="hero">
        <div className="hero-card">
          <p className="eyebrow">资源站优先</p>
          <h1>把游戏资讯、MOD 资源和讨论区放到同一张地图上</h1>
          <p>
            这个 MVP 以中文游戏社区为目标，首版先解决资源发现、投稿审核、讨论和基础运营。资源帖只做介绍和外链聚合，降低版权与存储压力。
          </p>
          <div className="button-row">
            <Link href="/resources" className="button-link">
              浏览 MOD 资源
            </Link>
            <Link href="/submit/resource" className="button-link secondary-button">
              发布资源帖
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat-box">
              <strong>{featuredResources.length}</strong>
              <span>推荐资源</span>
            </div>
            <div className="stat-box">
              <strong>{latestNews.length}</strong>
              <span>最新资讯</span>
            </div>
            <div className="stat-box">
              <strong>{hotTopics.length}</strong>
              <span>热门讨论</span>
            </div>
          </div>
        </div>
        <aside className="hero-side panel">
          <h2>首页聚合规则</h2>
          <p>资源推荐按后台推荐位 + 收藏热度优先，资讯按发布时间排序，论坛按评论量和浏览量排序。</p>
          <div className="list-stack">
            {featuredResources.slice(0, 3).map((item) => (
              <div key={item.id}>
                <strong>{item.title}</strong>
                <div className="meta-row">
                  <span>{item.gameName}</span>
                  <span>{formatDate(item.publishedAt)}</span>
                </div>
                <TagList tags={item.tags.map((tag) => tag.tag.name)} />
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section>
        <SectionHeader eyebrow="Resources" title="推荐 MOD / 资源" description="优先展示运营推荐和高收藏资源帖。" />
        <div className="grid-3">
          {featuredResources.map((item) => (
            <PostCard
              key={item.id}
              href={`/resources/${item.slug}`}
              title={item.title}
              summary={item.summary}
              meta={`${item.gameName} · ${item.author.nickname}`}
              date={item.publishedAt}
              badge={item.featured ? "推荐" : undefined}
            />
          ))}
        </div>
      </section>

      <section className="grid-2">
        <div>
          <SectionHeader eyebrow="News" title="最新资讯" />
          <div className="list-stack">
            {latestNews.map((item) => (
              <PostCard
                key={item.id}
                href={`/news/${item.slug}`}
                title={item.title}
                summary={item.summary}
                meta={`${item.category.name} · ${item.author.nickname}`}
                date={item.publishedAt}
              />
            ))}
          </div>
        </div>
        <div>
          <SectionHeader eyebrow="Forum" title="热门讨论" />
          <div className="list-stack">
            {hotTopics.map((item) => (
              <PostCard
                key={item.id}
                href={`/forum/${item.slug}`}
                title={item.title}
                summary={item.summary}
                meta={`${item.category.name} · ${item.author.nickname}`}
                date={item.publishedAt}
                badge={item.featured ? "热帖" : undefined}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
