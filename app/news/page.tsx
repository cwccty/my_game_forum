import { getPublishedNews } from "@/lib/queries";
import { SectionHeader } from "@/components/section-header";
import { PostCard } from "@/components/post-card";

export const metadata = {
  title: "游戏资讯"
};

export default async function NewsPage() {
  const posts = await getPublishedNews();

  return (
    <section>
      <SectionHeader eyebrow="News" title="游戏资讯" description="围绕游戏更新、活动、官方公告和版本前瞻的内容区。" />
      <div className="grid-2">
        {posts.map((item) => (
          <PostCard
            key={item.id}
            href={`/news/${item.slug}`}
            title={item.title}
            summary={item.summary}
            meta={`${item.category.name} · ${item.author.nickname}`}
            date={item.publishedAt}
            badge={item.featured ? "推荐" : undefined}
          />
        ))}
      </div>
    </section>
  );
}
