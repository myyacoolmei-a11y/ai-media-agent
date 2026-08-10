import { ArrowRight, Newspaper } from "lucide-react";
import Link from "next/link";

import { serializePublicContent } from "@/lib/content/public-query";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentItem } from "@/types/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { data } = await createAdminClient()
    .from("content_items")
    .select("*")
    .eq("content_type", "article")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(30);
  const articles = await Promise.all(
    ((data ?? []) as ContentItem[]).map(serializePublicContent),
  );

  return (
    <div className="min-h-screen bg-[#0a090a] text-white">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="text-sm font-semibold">
            AI Media
          </Link>
          <Link
            href="/admin"
            className="text-xs text-zinc-600 transition hover:text-white"
          >
            後台登入
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#d3b176]">
            Latest stories
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            最新內容
          </h1>
          <p className="mt-4 text-sm leading-7 text-zinc-500">
            只顯示已正式發布的文章。
          </p>
        </div>

        {articles.length ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="group overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025] transition hover:-translate-y-1 hover:border-white/15"
              >
                {article.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="aspect-[16/10] w-full object-cover"
                  />
                ) : (
                  <div className="grid aspect-[16/10] place-items-center bg-white/[0.02]">
                    <Newspaper className="size-6 text-zinc-800" />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-[10px] text-zinc-700">
                    {new Date(article.publishedAt).toLocaleDateString("zh-TW")}
                  </p>
                  <h2 className="mt-3 text-lg font-medium leading-7">
                    {article.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-xs leading-6 text-zinc-500">
                    {article.summary}
                  </p>
                  <span className="mt-5 flex items-center gap-1 text-xs text-zinc-600 group-hover:text-white">
                    閱讀文章
                    <ArrowRight className="size-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-3xl border border-dashed border-white/10 p-12 text-center">
            <Newspaper className="mx-auto size-6 text-zinc-700" />
            <p className="mt-4 text-sm text-zinc-600">目前還沒有已發布文章。</p>
          </div>
        )}
      </main>
    </div>
  );
}
