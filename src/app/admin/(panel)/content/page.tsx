import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { displayCategory } from "@/lib/content/categories";
import { formatStoryDate } from "@/lib/content/dates";
import { getPreviewDemoContentItems } from "@/lib/content/preview-demo";
import { getAuthenticatedUser } from "@/lib/jobs/access";
import { isPreviewDemo } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  contentStatusLabels,
  contentTypeLabels,
  type ContentItem,
} from "@/types/content";

export default async function AdminContentListPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?next=/admin/content");

  let items: ContentItem[] = [];
  if (isPreviewDemo()) {
    items = getPreviewDemoContentItems();
  } else {
    const { data } = await createAdminClient()
      .from("content_items")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["draft", "published"])
      .order("updated_at", { ascending: false });
    items = (data ?? []) as ContentItem[];
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em]">內容列表</h1>
          <p className="mt-3 text-sm text-zinc-500">
            管理草稿與已發布報導。發布後會出現在公開前台。
          </p>
        </div>
        <Link href="/admin/content/new" className={buttonVariants()}>
          <Plus className="size-4" />
          新增報導
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02]">
        {items.length ? (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/admin/content/${item.id}/edit`}
              className="grid gap-2 border-b border-white/[0.06] p-5 last:border-0 hover:bg-white/[0.025] sm:grid-cols-[1fr_140px_90px_90px_120px] sm:items-center"
            >
              <div>
                <p className="text-sm text-zinc-200">
                  {item.title || "未命名報導"}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-zinc-700">
                  {item.summary || "尚未填寫摘要"}
                </p>
              </div>
              <span className="text-xs text-zinc-600">
                {displayCategory(item.category)}
              </span>
              <span className="text-xs text-zinc-600">
                {contentTypeLabels[item.content_type]}
              </span>
              <span
                className={
                  item.status === "published"
                    ? "text-xs text-emerald-300"
                    : "text-xs text-zinc-600"
                }
              >
                {contentStatusLabels[item.status]}
              </span>
              <span className="text-xs text-zinc-700">
                {formatStoryDate(item.published_at || item.updated_at)}
              </span>
            </Link>
          ))
        ) : (
          <div className="p-14 text-center">
            <FileText className="mx-auto size-6 text-zinc-700" />
            <p className="mt-4 text-sm text-zinc-600">還沒有報導。</p>
          </div>
        )}
      </div>
    </div>
  );
}
