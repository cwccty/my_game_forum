import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createForumAction } from "@/app/actions";
import { getPublishMeta } from "@/lib/queries";
import { SubmitTabs } from "@/components/submit-tabs";

export default async function SubmitForumPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { categories, tags } = await getPublishMeta();

  return (
    <section className="content-stack">
      <SubmitTabs current="forum" />
      <form action={createForumAction} className="panel form-stack">
        <h1>发布论坛帖</h1>
        <label>标题<input name="title" required /></label>
        <label>摘要<textarea name="summary" rows={3} required /></label>
        <label>正文<textarea name="content" rows={10} required /></label>
        <label>
          版块
          <select name="categoryId" required defaultValue="">
            <option value="" disabled>请选择论坛版块</option>
            {categories.filter((item) => item.type === "FORUM").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
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
