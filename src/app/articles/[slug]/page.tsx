import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { serializePublicContent } from "@/lib/content/public-query";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentItem } from "@/types/content";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const { data } = await createAdminClient()
    .from("content_items")
    .select("*")
    .eq("slug", slug)
    .eq("content_type", "article")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .single();
  if (!data) notFound();
  const article = await serializePublicContent(data as ContentItem);

  return (
    <div className="min-h-screen bg-[#0a090a] text-white">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            返回首頁
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-20">
        <article>
          <p className="text-xs text-[#d3b176]">
            {new Date(article.publishedAt).toLocaleDateString("zh-TW")}
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-6xl">
            {article.title}
          </h1>
          <p className="mt-7 text-lg leading-8 text-zinc-400">
            {article.summary}
          </p>

          {article.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverImage}
              alt={article.title}
              className="mt-10 aspect-[16/9] w-full rounded-3xl object-cover"
            />
          )}

          {article.videoUrl && (
            <a
              href={article.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-sm text-zinc-300 hover:border-white/15"
            >
              觀看相關影片
              <ExternalLink className="size-4" />
            </a>
          )}

          <div className="mt-12 whitespace-pre-wrap border-t border-white/[0.07] pt-10 text-base leading-9 text-zinc-300">
            {article.content}
          </div>
        </article>
      </main>
    </div>
  );
}
