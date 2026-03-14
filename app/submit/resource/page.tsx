import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createResourceAction } from "@/app/actions";
import { getPublishMeta } from "@/lib/queries";
import { SubmitTabs } from "@/components/submit-tabs";

export default async function SubmitResourcePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { categories, tags } = await getPublishMeta();

  return (
    <section className="content-stack">
      <SubmitTabs current="resource" />
      <form action={createResourceAction} className="panel form-stack">
        <h1>投稿资源帖</h1>
        <label>标题<input name="title" required /></label>
        <label>摘要<textarea name="summary" rows={3} required /></label>
        <label>资源介绍<textarea name="description" rows={10} required /></label>
        <div className="grid-2">
          <label>游戏名<input name="gameName" required /></label>
          <label>适配游戏版本<input name="gameVersion" required /></label>
        </div>
        <div className="grid-2">
          <label>资源版本<input name="resourceVersion" /></label>
          <label>外部下载链接<input name="externalUrl" type="url" required /></label>
        </div>
        <label>封面图 URL<input name="coverImage" type="url" /></label>
        <label>截图 URL<textarea name="galleryImages" rows={4} placeholder="一行一个 URL" /></label>
        <label>
          分类
          <select name="categoryId" required defaultValue="">
            <option value="" disabled>请选择资源分类</option>
            {categories.filter((item) => item.type === "RESOURCE").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <div>
          <p>标签</p>
          <div className="checkbox-grid">
            {tags.map((tag) => <label key={tag.id} className="checkbox-item"><input type="checkbox" name="tagIds" value={tag.id} />{tag.name}</label>)}
          </div>
        </div>
        <button type="submit">提交审核</button>
      </form>
    </section>
  );
}
