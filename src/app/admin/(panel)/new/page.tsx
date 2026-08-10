import { ArticleCreateForm } from "@/components/admin/article-create-form";

export default function NewArticlePage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-[-0.045em]">新增文章</h1>
        <p className="mt-3 text-sm text-zinc-500">
          先建立草稿，再補上摘要、內文與封面。
        </p>
      </div>
      <ArticleCreateForm />
    </div>
  );
}
