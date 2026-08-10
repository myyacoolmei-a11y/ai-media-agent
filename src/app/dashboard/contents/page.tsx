import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/jobs/access";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  contentStatusLabels,
  contentTypeLabels,
  type ContentItem,
  type ContentStatus,
} from "@/types/content";

type ContentsPageProps = {
  searchParams: Promise<{ status?: string }>;
};

const filters: Array<{ label: string; value?: ContentStatus }> = [
  { label: "全部" },
  { label: "草稿", value: "draft" },
  { label: "預覽中", value: "preview" },
  { label: "已發布", value: "published" },
  { label: "已封存", value: "archived" },
];

export default async function ContentsPage({
  searchParams,
}: ContentsPageProps) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  const { status } = await searchParams;
  let query = createAdminClient()
    .from("content_items")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (filters.some((filter) => filter.value === status)) {
    query = query.eq("status", status);
  }
  const { data } = await query;
  const contents = (data ?? []) as ContentItem[];

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em]">
            內容管理
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            管理草稿、預覽與已發布內容。
          </p>
        </div>
        <Link href="/dashboard/contents/new" className={buttonVariants()}>
          <Plus className="size-4" />
          新增內容
        </Link>
      </div>

      <div className="mt-8 flex gap-1 overflow-x-auto rounded-full border border-white/[0.07] bg-white/[0.02] p-1">
        {filters.map((filter) => {
          const active = status === filter.value || (!status && !filter.value);
          return (
            <Link
              key={filter.label}
              href={
                filter.value
                  ? `/dashboard/contents?status=${filter.value}`
                  : "/dashboard/contents"
              }
              className={`shrink-0 rounded-full px-4 py-2 text-xs transition ${
                active ? "bg-white/10 text-white" : "text-zinc-600 hover:text-white"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] border border-white/[0.07] bg-white/[0.02]">
        {contents.length ? (
          contents.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/contents/${item.id}/edit`}
              className="grid gap-3 border-b border-white/[0.06] p-5 transition last:border-0 hover:bg-white/[0.025] sm:grid-cols-[minmax(0,1fr)_130px_110px_140px] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-200">
                  {item.title || "未命名內容"}
                </p>
                <p className="mt-1 truncate text-[11px] text-zinc-700">
                  /{item.slug}
                </p>
              </div>
              <span className="text-xs text-zinc-500">
                {contentTypeLabels[item.content_type]}
              </span>
              <span className="text-xs text-zinc-500">
                {contentStatusLabels[item.status]}
              </span>
              <span className="text-xs text-zinc-700">
                {new Date(item.updated_at).toLocaleDateString("zh-TW")}
              </span>
            </Link>
          ))
        ) : (
          <div className="p-14 text-center">
            <FileText className="mx-auto size-6 text-zinc-700" />
            <p className="mt-4 text-sm text-zinc-600">這個分類還沒有內容。</p>
          </div>
        )}
      </div>
    </div>
  );
}
