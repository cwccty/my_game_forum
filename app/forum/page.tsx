import { getPublishedForumPosts } from "@/lib/queries";
import { PostCard } from "@/components/post-card";
import { SectionHeader } from "@/components/section-header";

export const metadata = {
  title: "论坛讨论"
};

export default async function ForumPage() {
  const posts = await getPublishedForumPosts();

  return (
    <section>
      <SectionHeader eyebrow="Forum" title="论坛讨论区" description="首版保留轻量版块体系，用于攻略、MOD 交流和综合讨论。" />
      <div className="grid-2">
        {posts.map((item) => (
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
    </section>
  );
}
