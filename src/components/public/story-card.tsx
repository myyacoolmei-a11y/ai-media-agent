import { Newspaper, Play } from "lucide-react";
import Link from "next/link";

import { displayCategory } from "@/lib/content/categories";
import { formatStoryDate } from "@/lib/content/dates";
import { isVideoStory } from "@/lib/content/video";
import { cn } from "@/lib/utils";
import type { PublicContentItem } from "@/types/content";

export function StoryCard({
  story,
  variant = "grid",
}: {
  story: PublicContentItem;
  variant?: "grid" | "row" | "featured";
}) {
  const href = `/article/${story.slug}`;
  const video = isVideoStory(story);
  const category = displayCategory(story.category);

  if (variant === "row") {
    return (
      <Link
        href={href}
        className="group flex gap-4 border-b border-white/[0.06] py-4 last:border-0"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-[#d3b176]">
            {category}
            {video ? " · 影音" : ""} · {formatStoryDate(story.publishedAt)}
          </p>
          <h3 className="mt-1 text-sm font-medium leading-6 text-zinc-100 group-hover:text-white">
            {story.title}
          </h3>
        </div>
        {story.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.coverImage}
            alt=""
            className="size-16 shrink-0 rounded-lg object-cover sm:size-20"
          />
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] transition hover:-translate-y-0.5 hover:border-white/15",
        variant === "featured" && "lg:grid lg:grid-cols-[1.35fr_1fr]",
      )}
    >
      <div className="relative">
        {story.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.coverImage}
            alt={story.title}
            className={cn(
              "w-full object-cover",
              variant === "featured"
                ? "aspect-[16/10] lg:h-full"
                : "aspect-[16/10]",
            )}
          />
        ) : (
          <div
            className={cn(
              "grid place-items-center bg-white/[0.02]",
              variant === "featured"
                ? "aspect-[16/10] lg:h-full"
                : "aspect-[16/10]",
            )}
          >
            {video ? (
              <Play className="size-7 text-zinc-700" />
            ) : (
              <Newspaper className="size-7 text-zinc-700" />
            )}
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] text-white">
          {video ? "影音" : category}
        </span>
      </div>
      <div
        className={cn(
          "p-4 sm:p-5",
          variant === "featured" && "lg:flex lg:flex-col lg:justify-center lg:p-8",
        )}
      >
        <p className="text-[11px] text-[#d3b176]">
          {category} · {formatStoryDate(story.publishedAt)}
        </p>
        <h2
          className={cn(
            "mt-2 font-semibold tracking-[-0.03em] text-white",
            variant === "featured"
              ? "font-[family-name:var(--font-news-serif)] text-2xl leading-8 sm:text-4xl sm:leading-tight"
              : "text-lg leading-7",
          )}
        >
          {story.title}
        </h2>
        {story.summary ? (
          <p
            className={cn(
              "mt-3 text-sm leading-7 text-zinc-500",
              variant === "featured" ? "line-clamp-4" : "line-clamp-3",
            )}
          >
            {story.summary}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function EmptyStories({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
      <Newspaper className="mx-auto size-6 text-zinc-700" />
      <p className="mt-4 text-sm text-zinc-600">{message}</p>
    </div>
  );
}
