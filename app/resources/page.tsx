import { getPublishedResources } from "@/lib/queries";
import { SectionHeader } from "@/components/section-header";
import { PostCard } from "@/components/post-card";

export const metadata = {
  title: "MOD 资源"
};

export default async function ResourcesPage() {
  const posts = await getPublishedResources();

  return (
    <section>
      <SectionHeader eyebrow="Resources" title="MOD 资源区" description="站内保存介绍、版本、标签和外部下载链接，不托管文件本体。" />
      <div className="grid-2">
        {posts.map((item) => (
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
  );
}
