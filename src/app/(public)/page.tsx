import Link from "next/link";

import {
  EmptyStories,
  SectionHeading,
  StoryCard,
} from "@/components/public/story-card";
import { listPublishedStories } from "@/lib/content/published";
import { isVideoStory } from "@/lib/content/video";

export const dynamic = "force-dynamic";

const HOME_CATEGORIES = ["財經", "社會", "生活", "科技"] as const;

export default async function HomePage() {
  const stories = await listPublishedStories({ limit: 24 });
  const featured =
    stories.find((story) => story.coverImage) ?? stories[0] ?? null;
  const rest = stories.filter((story) => story.slug !== featured?.slug);
  const latest = rest.filter((story) => !isVideoStory(story)).slice(0, 6);
  const ranking = rest.slice(0, 5);
  const videos = stories.filter(isVideoStory).slice(0, 2);

  return (
    <div className="pb-6 sm:pb-10">
      {featured ? (
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19.5rem] lg:gap-12 lg:border-b lg:border-white/[0.08] lg:pb-12">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#d3b176]">
              Today
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-news-serif)] text-xl tracking-[-0.03em] text-zinc-300 sm:text-2xl">
              今日焦點
            </h1>
            <div className="mt-5 sm:mt-6">
              <StoryCard story={featured} variant="hero" />
            </div>
          </div>
          <aside className="hidden lg:block">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#d3b176]">
              Ranking
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-news-serif)] text-xl tracking-[-0.03em]">
              熱門新聞排行
            </h2>
            <div className="mt-5 border-t border-white/[0.1]">
              {ranking.length ? (
                ranking.map((story, index) => (
                  <StoryCard
                    key={story.slug}
                    story={story}
                    variant="ranking"
                    rank={index + 1}
                  />
                ))
              ) : (
                <p className="py-8 text-sm text-zinc-600">尚無其他報導。</p>
              )}
            </div>
          </aside>
        </section>
      ) : (
        <div className="mt-4">
          <EmptyStories message="目前還沒有已發布報導。登入後台新增並發布後，就會出現在這裡。" />
        </div>
      )}

      <section className="mt-12 sm:mt-16">
        <SectionHeading kicker="Latest" title="最新報導" href="/news" />
        {latest.length ? (
          <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((story) => (
              <StoryCard key={story.slug} story={story} />
            ))}
          </div>
        ) : featured ? (
          <p className="mt-6 text-sm text-zinc-600">更多報導發布後會顯示在這裡。</p>
        ) : null}
      </section>

      <section className="mt-16 grid gap-12 sm:mt-20 lg:grid-cols-2 lg:gap-x-14 lg:gap-y-16">
        {HOME_CATEGORIES.map((category) => {
          const items = stories
            .filter(
              (story) =>
                story.category === category && story.slug !== featured?.slug,
            )
            .slice(0, 2);
          return (
            <div key={category}>
              <SectionHeading
                title={category}
                href={`/news?category=${encodeURIComponent(category)}`}
              />
              {items.length ? (
                <div className="divide-y divide-white/[0.07]">
                  {items.map((story) => (
                    <StoryCard key={story.slug} story={story} variant="row" />
                  ))}
                </div>
              ) : (
                <p className="py-8 text-sm text-zinc-600">
                  這個分類還沒有已發布報導。
                </p>
              )}
            </div>
          );
        })}
      </section>

      <section className="mt-16 sm:mt-20">
        <SectionHeading kicker="Video" title="影音報導" href="/video" />
        {videos.length ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {videos.map((story) => (
              <StoryCard key={story.slug} story={story} variant="video" />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-zinc-600">
            發布含影片網址或影音類型的報導後，會顯示在這個區塊。
          </p>
        )}
      </section>

      <p className="mt-16 text-center text-xs text-zinc-600 sm:mt-20">
        只呈現已發布報導。草稿不會出現在公開網站。
        {" · "}
        <Link href="/news" className="hover:text-white">
          全部報導
        </Link>
      </p>
    </div>
  );
}
