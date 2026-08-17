import Link from "next/link";

import { EmptyStories, StoryCard } from "@/components/public/story-card";
import { listPublishedStories } from "@/lib/content/published";
import { isVideoStory } from "@/lib/content/video";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stories = await listPublishedStories({ limit: 18 });
  const featured =
    stories.find((story) => story.coverImage) ?? stories[0] ?? null;
  const rest = stories.filter((story) => story.slug !== featured?.slug);
  const headlines = rest.slice(0, 5);
  const latest = rest.slice(0, 8);
  const videos = stories.filter(isVideoStory).slice(0, 3);

  return (
    <div>
      <section className="max-w-3xl">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#d3b176]">
          AI Media
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          今日頭條
        </h1>
        <p className="mt-4 text-sm leading-7 text-zinc-500">
          精簡版媒體首頁，只呈現已發布的報導與影音。
        </p>
      </section>

      {featured ? (
        <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
          <StoryCard story={featured} variant="featured" />
          <aside className="rounded-3xl border border-white/[0.08] bg-white/[0.02] px-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] py-4">
              <h2 className="text-sm font-medium">最新標題</h2>
              <Link href="/news" className="text-xs text-zinc-600 hover:text-white">
                全部報導
              </Link>
            </div>
            {headlines.length ? (
              headlines.map((story) => (
                <StoryCard key={story.slug} story={story} variant="row" />
              ))
            ) : (
              <p className="py-8 text-sm text-zinc-600">目前沒有其他標題。</p>
            )}
          </aside>
        </section>
      ) : (
        <div className="mt-10">
          <EmptyStories message="目前還沒有已發布報導。登入後台新增並發布後，就會出現在這裡。" />
        </div>
      )}

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#d3b176]">
              Latest
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              最新報導
            </h2>
          </div>
          <Link href="/news" className="text-xs text-zinc-500 hover:text-white">
            看更多
          </Link>
        </div>
        {latest.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((story) => (
              <StoryCard key={story.slug} story={story} />
            ))}
          </div>
        ) : featured ? (
          <p className="mt-6 text-sm text-zinc-600">更多報導發布後會顯示在這裡。</p>
        ) : null}
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#d3b176]">
              Video
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              影音報導
            </h2>
          </div>
          <Link href="/video" className="text-xs text-zinc-500 hover:text-white">
            看更多
          </Link>
        </div>
        {videos.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((story) => (
              <StoryCard key={story.slug} story={story} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-zinc-600">
            發布含影片網址或影音類型的報導後，會顯示在這個區塊。
          </p>
        )}
      </section>
    </div>
  );
}
