import { ArrowRight, FileText, Plus, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { formatStoryDateTime } from "@/lib/content/dates";
import { getPreviewDemoContentItems } from "@/lib/content/preview-demo";
import { requireBrandContext } from "@/lib/brands/access";
import { isPreviewDemo } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";
import {
  contentStatusLabels,
  type ContentItem,
} from "@/types/content";

export default async function AdminHomePage() {
  const context = await requireBrandContext();
  if (!context) redirect("/login?next=/admin");

  let draftCount = 0;
  let publishedCount = 0;
  let items: ContentItem[] = [];

  if (isPreviewDemo()) {
    items = getPreviewDemoContentItems();
    publishedCount = items.length;
  } else {
    const supabase = createAdminClient();
    const [drafts, published, recent] = await Promise.all([
      supabase
        .from("content_items")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", context.brand.id)
        .eq("status", "draft"),
      supabase
        .from("content_items")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", context.brand.id)
        .eq("status", "published"),
      supabase
        .from("content_items")
        .select("*")
        .eq("brand_id", context.brand.id)
        .in("status", ["draft", "published"])
        .order("updated_at", { ascending: false })
        .limit(6),
    ]);
    draftCount = drafts.count ?? 0;
    publishedCount = published.count ?? 0;
    items = (recent.data ?? []) as ContentItem[];
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#d3b176]">
            Admin
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
            媒體後台
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            新增報導、儲存草稿，發布後就會出現在公開首頁。
          </p>
        </div>
        <Link href="/admin/content/new" className={buttonVariants()}>
          <Plus className="size-4" />
          新增報導
        </Link>
      </div>

      <Link
        href="/admin/assistant"
        className="mt-8 flex items-center justify-between gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 hover:border-white/15"
      >
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-4 text-[#d3b176]" />
          <div>
            <p className="text-sm font-medium">AI 報導助手</p>
            <p className="mt-1 text-xs leading-6 text-zinc-500">
              影片上傳、語音辨識、畫面分析、AI 文案、標題、SEO 與 Hashtag。
            </p>
          </div>
        </div>
        <ArrowRight className="size-4 shrink-0 text-zinc-600" />
      </Link>

      <Link
        href="/admin/social"
        className="mt-3 flex items-center justify-between gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 hover:border-white/15"
      >
        <div>
          <p className="text-sm font-medium">社群發布</p>
          <p className="mt-1 text-xs leading-6 text-zinc-500">
            查看 Facebook / Instagram / Threads / TikTok 各自的發布狀態與錯誤。
          </p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-zinc-600" />
      </Link>

      <div className="mt-9 grid gap-3 sm:grid-cols-2">
        {[
          ["草稿", draftCount, FileText],
          ["已發布", publishedCount, Send],
        ].map(([label, count, Icon]) => {
          const StatIcon = Icon as typeof FileText;
          return (
            <div
              key={label as string}
              className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5"
            >
              <StatIcon className="size-4 text-[#d3b176]" />
              <p className="mt-8 text-3xl font-semibold">{count as number}</p>
              <p className="mt-1 text-xs text-zinc-600">{label as string}</p>
            </div>
          );
        })}
      </div>

      <section className="mt-8 rounded-[28px] border border-white/[0.07] bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
          <h2 className="text-sm font-medium">最近內容</h2>
          <Link
            href="/admin/content"
            className="flex items-center gap-1 text-xs text-zinc-600 hover:text-white"
          >
            內容列表
            <ArrowRight className="size-3" />
          </Link>
        </div>
        {items.length ? (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/admin/content/${item.id}/edit`}
              className="flex items-center gap-4 border-b border-white/[0.05] px-5 py-4 last:border-0 hover:bg-white/[0.02]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-200">
                  {item.title || "未命名報導"}
                </p>
                <p className="mt-1 text-[11px] text-zinc-700">
                  {formatStoryDateTime(item.updated_at)}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px]",
                  item.status === "published"
                    ? "bg-emerald-300/10 text-emerald-300"
                    : "bg-white/[0.04] text-zinc-500",
                )}
              >
                {contentStatusLabels[item.status]}
              </span>
            </Link>
          ))
        ) : (
          <div className="p-10 text-center text-sm text-zinc-700">
            還沒有內容，先新增第一篇報導。
          </div>
        )}
      </section>
    </div>
  );
}
