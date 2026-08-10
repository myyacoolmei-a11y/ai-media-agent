import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/jobs/access";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentItem } from "@/types/content";

export default async function AdminPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/admin/login");
  const { data } = await createAdminClient()
    .from("content_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("content_type", "article")
    .in("status", ["draft", "published"])
    .order("updated_at", { ascending: false });
  const articles = (data ?? []) as ContentItem[];

  return (
    <div>
      <div className="flex items-end justify-between gap-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em]">文章管理</h1>
          <p className="mt-3 text-sm text-zinc-500">
            新增文章、儲存草稿，確認後發布到媒體網站。
          </p>
        </div>
        <Link href="/admin/new" className={buttonVariants()}>
          <Plus className="size-4" />
          新增文章
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02]">
        {articles.length ? (
          articles.map((article) => (
            <Link
              key={article.id}
              href={`/admin/${article.id}/edit`}
              className="grid gap-2 border-b border-white/[0.06] p-5 last:border-0 hover:bg-white/[0.025] sm:grid-cols-[1fr_100px_140px] sm:items-center"
            >
              <div>
                <p className="text-sm text-zinc-200">{article.title}</p>
                <p className="mt-1 line-clamp-1 text-xs text-zinc-700">
                  {article.summary || "尚未填寫摘要"}
                </p>
              </div>
              <span
                className={
                  article.status === "published"
                    ? "text-xs text-emerald-300"
                    : "text-xs text-zinc-600"
                }
              >
                {article.status === "published" ? "已發布" : "草稿"}
              </span>
              <span className="text-xs text-zinc-700">
                {new Date(article.updated_at).toLocaleDateString("zh-TW")}
              </span>
            </Link>
          ))
        ) : (
          <div className="p-14 text-center">
            <FileText className="mx-auto size-6 text-zinc-700" />
            <p className="mt-4 text-sm text-zinc-600">還沒有文章。</p>
          </div>
        )}
      </div>
    </div>
  );
}
