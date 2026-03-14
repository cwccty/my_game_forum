import { getSearchResults } from "@/lib/queries";
import { PostCard } from "@/components/post-card";

export const metadata = {
  title: "搜索"
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const results = await getSearchResults(q);

  return (
    <section className="content-stack">
      <form className="panel form-stack">
        <h1>搜索资讯和 MOD 资源</h1>
        <input name="q" defaultValue={q} placeholder="输入游戏名、标签或关键词" />
        <button type="submit">搜索</button>
      </form>
      {q ? (
        <>
          <div>
            <h2>资讯结果</h2>
            <div className="grid-2">
              {results.news.length ? results.news.map((item) => (
                <PostCard key={item.id} href={`/news/${item.slug}`} title={item.title} summary={item.summary} meta={`${item.category.name} · ${item.author.nickname}`} date={item.publishedAt} />
              )) : <div className="empty-state">没有找到匹配的资讯内容。</div>}
            </div>
          </div>
          <div>
            <h2>资源结果</h2>
            <div className="grid-2">
              {results.resources.length ? results.resources.map((item) => (
                <PostCard key={item.id} href={`/resources/${item.slug}`} title={item.title} summary={item.summary} meta={`${item.gameName} · ${item.author.nickname}`} date={item.publishedAt} />
              )) : <div className="empty-state">没有找到匹配的资源内容。</div>}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}


