import Link from "next/link";

import { EmptyStories, StoryCard } from "@/components/public/story-card";
import { listPublishedStories } from "@/lib/content/published";
import { isVideoStory } from "@/lib/content/video";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stories = await listPublishedStories({ limit: 24 });
  const featured =
    stories.find((story) => story.coverImage) ?? stories[0] ?? null;
  const rest = stories.filter((story) => story.slug !== featured?.slug);
  const headlines = rest.filter((story) => !isVideoStory(story)).slice(0, 6);
  const latest = rest.filter((story) => !isVideoStory(story)).slice(0, 9);
  const videos = stories.filter(isVideoStory).slice(0, 3);

  return (
    <div>
      <section className="flex flex-col justify-between gap-3 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#d3b176]">
            Focus
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-news-serif)] text-3xl tracking-[-0.03em] sm:text-4xl">
            今日焦點
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-zinc-500">
          只呈現已發布報導。草稿不會出現在公開網站。
        </p>
      </section>

      {featured ? (
        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
          <StoryCard story={featured} variant="featured" />
          <aside className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] py-4">
              <h2 className="text-sm font-medium">焦點標題</h2>
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
        <div className="mt-8">
          <EmptyStories message="目前還沒有已發布報導。登入後台新增並發布後，就會出現在這裡。" />
        </div>
      )}

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-[family-name:var(--font-news-serif)] text-2xl tracking-[-0.03em]">
            最新報導
          </h2>
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
          <h2 className="font-[family-name:var(--font-news-serif)] text-2xl tracking-[-0.03em]">
            影音報導
          </h2>
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
