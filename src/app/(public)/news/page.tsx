import type { Metadata } from "next";

import { EmptyStories, StoryCard } from "@/components/public/story-card";
import { MEDIA_CATEGORIES } from "@/lib/content/categories";
import { listPublishedStories } from "@/lib/content/published";

export const dynamic = "force-dynamic";

type NewsPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({
  searchParams,
}: NewsPageProps): Promise<Metadata> {
  const { category } = await searchParams;
  if (category && MEDIA_CATEGORIES.includes(category as (typeof MEDIA_CATEGORIES)[number])) {
    return { title: category, description: `AI Media ${category}報導` };
  }
  return { title: "最新報導", description: "AI Media 已發布的最新報導列表。" };
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const { category: rawCategory } = await searchParams;
  const category =
    rawCategory &&
    MEDIA_CATEGORIES.includes(rawCategory as (typeof MEDIA_CATEGORIES)[number])
      ? rawCategory
      : undefined;
  const stories = await listPublishedStories({
    limit: 40,
    category,
  });

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.22em] text-[#d3b176]">
        News
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-news-serif)] text-3xl tracking-[-0.03em] sm:text-4xl">
        {category ?? "最新報導"}
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
        依發布時間排序，只顯示已正式發布的內容。
      </p>
      {stories.length ? (
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <StoryCard key={story.slug} story={story} />
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyStories
            message={
              category
                ? `目前還沒有「${category}」的已發布報導。`
                : "目前還沒有已發布報導。"
            }
          />
        </div>
      )}
    </div>
  );
}
