import { ArrowRight, Eye, FileText, Plus, Send } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { requireBrandContext } from "@/lib/brands/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";
import { contentStatusLabels, contentTypeLabels } from "@/types/content";

export default async function DashboardPage() {
  const context = await requireBrandContext();
  if (!context) redirect("/login");
  const supabase = createAdminClient();
  const [drafts, previews, published, recent] = await Promise.all([
    supabase
      .from("content_items")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", context.brand.id)
      .eq("status", "draft"),
    supabase
      .from("content_items")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", context.brand.id)
      .eq("status", "preview"),
    supabase
      .from("content_items")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", context.brand.id)
      .eq("status", "published"),
    supabase
      .from("content_items")
      .select("id,title,content_type,status,updated_at")
      .eq("brand_id", context.brand.id)
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#d3b176]">
            Content workspace
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
            內容製作後台
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            從草稿、預覽到發布，集中管理所有影片、圖文與文章。
          </p>
        </div>
        <Link href="/dashboard/contents/new" className={buttonVariants()}>
          <Plus className="size-4" />
          新增內容
        </Link>
      </div>

      <div className="mt-9 grid gap-3 sm:grid-cols-3">
        {[
          ["草稿", drafts.count ?? 0, FileText],
          ["預覽中", previews.count ?? 0, Eye],
          ["已發布", published.count ?? 0, Send],
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
            href="/dashboard/contents"
            className="flex items-center gap-1 text-xs text-zinc-600 hover:text-white"
          >
            查看全部
            <ArrowRight className="size-3" />
          </Link>
        </div>
        {recent.data?.length ? (
          <div>
            {recent.data.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/contents/${item.id}/edit`}
                className="flex items-center gap-4 border-b border-white/[0.05] px-5 py-4 last:border-0 hover:bg-white/[0.02]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-200">
                    {item.title || "未命名內容"}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-700">
                    {contentTypeLabels[item.content_type as keyof typeof contentTypeLabels]}
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
                  {contentStatusLabels[item.status as keyof typeof contentStatusLabels]}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-zinc-700">
            還沒有內容，先建立第一份草稿。
          </div>
        )}
      </section>
    </div>
  );
}
