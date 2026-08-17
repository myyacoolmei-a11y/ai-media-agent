import Link from "next/link";

import {
  EmptyStories,
  SectionHeading,
  StoryCard,
} from "@/components/public/story-card";
import {
  getSectionBySlug,
  localFocusStories,
  matchesSection,
  matchesTopic,
} from "@/lib/content/categories";
import { listPublishedStories } from "@/lib/content/published";
import { isVideoStory } from "@/lib/content/video";
import type { PublicContentItem } from "@/types/content";

export const dynamic = "force-dynamic";

function take(
  stories: PublicContentItem[],
  count: number,
  predicate: (story: PublicContentItem) => boolean = () => true,
) {
  return stories.filter(predicate).slice(0, count);
}

function CategoryRows({
  title,
  href,
  items,
}: {
  title: string;
  href: string;
  items: PublicContentItem[];
}) {
  return (
    <div>
      <SectionHeading title={title} href={href} />
      {items.length ? (
        <div className="divide-y divide-white/[0.07]">
          {items.map((story) => (
            <StoryCard key={story.slug} story={story} variant="row" />
          ))}
        </div>
      ) : (
        <p className="py-8 text-sm text-zinc-600">這個分類還沒有已發布報導。</p>
      )}
    </div>
  );
}

export default async function HomePage() {
  const stories = await listPublishedStories({ limit: 48 });
  const local = getSectionBySlug("local");
  const people = getSectionBySlug("people");
  const clubTopic = local?.topics.find((topic) => topic.slug === "clubs");

  const featured =
    stories.find((story) => story.coverImage && !isVideoStory(story)) ??
    stories[0] ??
    null;
  const rest = stories.filter((story) => story.slug !== featured?.slug);
  const ranking = rest.slice(0, 5);
  const localStories = take(localFocusStories(rest), 4);
  const latest = take(rest, 6, (story) => !isVideoStory(story));
  const peopleStories = take(rest, 3, (story) =>
    people ? matchesSection(story.category, people.label) : false,
  );
  const business = take(rest, 2, (story) => matchesSection(story.category, "財經"));
  const society = take(rest, 2, (story) => matchesSection(story.category, "社會"));
  const lifestyle = take(rest, 2, (story) => matchesSection(story.category, "生活"));
  const technology = take(rest, 2, (story) =>
    matchesSection(story.category, "科技"),
  );
  const clubs = take(rest, 3, (story) =>
    local && clubTopic
      ? matchesTopic(story.category, local.label, clubTopic.label)
      : false,
  );
  const videos = take(stories, 2, isVideoStory);

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
            <p className="mt-2 text-[11px] leading-5 text-zinc-600">
              依現有已發布報導排列，尚未統計真實點閱。
            </p>
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
        <SectionHeading
          kicker="Local"
          title="地方焦點"
          href={local?.href ?? "/category/local"}
        />
        {localStories.length ? (
          <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {localStories.map((story) => (
              <StoryCard key={story.slug} story={story} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-zinc-600">
            發布地方報導後，會顯示在這個區塊。
          </p>
        )}
      </section>

      <section className="mt-16 sm:mt-20">
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

      <section className="mt-16 sm:mt-20">
        <SectionHeading
          kicker="People"
          title="人物專訪"
          href={people?.href ?? "/category/people"}
        />
        {peopleStories.length ? (
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {peopleStories.map((story) => (
              <StoryCard key={story.slug} story={story} variant="people" />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-zinc-600">
            發布人物報導後，會以大圖卡片顯示在這裡。
          </p>
        )}
      </section>

      <section className="mt-16 grid gap-12 sm:mt-20 lg:grid-cols-2 lg:gap-x-14 lg:gap-y-16">
        <CategoryRows title="財經／企業" href="/category/business" items={business} />
        <CategoryRows title="社會" href="/category/society" items={society} />
        <CategoryRows title="生活" href="/category/lifestyle" items={lifestyle} />
        <CategoryRows title="科技" href="/category/technology" items={technology} />
      </section>

      <section className="mt-16 sm:mt-20">
        <SectionHeading
          kicker="Community"
          title="社團動態"
          href={
            local && clubTopic
              ? `${local.href}?topic=${clubTopic.slug}`
              : "/category/local"
          }
        />
        {clubs.length ? (
          <div className="mt-4 grid gap-x-12 sm:grid-cols-2">
            {clubs.map((story) => (
              <StoryCard key={story.slug} story={story} variant="row" />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-zinc-600">
            青商會、扶輪社、獅子會、商圈與地方協會的報導會出現在這裡。
          </p>
        )}
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
