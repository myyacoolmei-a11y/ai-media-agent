import type { Metadata } from "next";

import { EmptyStories, StoryCard } from "@/components/public/story-card";
import { SITE_NAME } from "@/lib/brand";
import { listPublishedStories } from "@/lib/content/published";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "影音報導",
  description: `${SITE_NAME}已發布的影音報導。`,
};

export default async function VideoPage() {
  const stories = await listPublishedStories({ limit: 40, videosOnly: true });

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.22em] text-[#d3b176]">
        Video
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-news-serif)] text-3xl tracking-[-0.03em] sm:text-4xl">
        影音報導
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
        顯示含影片網址，或類型為影音的已發布內容。
      </p>
      {stories.length ? (
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {stories.map((story) => (
              <StoryCard key={story.slug} story={story} variant="video" />
            ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyStories message="目前還沒有已發布的影音報導。" />
        </div>
      )}
    </div>
  );
}
