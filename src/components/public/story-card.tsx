import { Newspaper, Play } from "lucide-react";
import Link from "next/link";

import { displayCategory } from "@/lib/content/categories";
import { formatStoryDate } from "@/lib/content/dates";
import { isVideoStory } from "@/lib/content/video";
import { cn } from "@/lib/utils";
import type { PublicContentItem } from "@/types/content";

function Cover({
  story,
  className,
  showPlay = false,
  eager = false,
}: {
  story: PublicContentItem;
  className?: string;
  showPlay?: boolean;
  eager?: boolean;
}) {
  const video = isVideoStory(story);
  return (
    <div className={cn("relative overflow-hidden bg-white/[0.04]", className)}>
      {story.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={story.coverImage}
          alt={story.title}
          loading={eager ? "eager" : "lazy"}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="grid h-full min-h-[8rem] place-items-center">
          {video ? (
            <Play className="size-7 text-zinc-600" />
          ) : (
            <Newspaper className="size-7 text-zinc-600" />
          )}
        </div>
      )}
      {showPlay ? (
        <span className="absolute inset-0 grid place-items-center bg-black/25">
          <span className="grid size-14 place-items-center rounded-full bg-black/70 text-white shadow-lg ring-1 ring-white/35 sm:size-16">
            <Play className="ml-0.5 size-6 fill-white sm:size-7" />
          </span>
        </span>
      ) : null}
    </div>
  );
}

export function StoryCard({
  story,
  variant = "grid",
  rank,
}: {
  story: PublicContentItem;
  variant?: "grid" | "row" | "featured" | "hero" | "ranking" | "video" | "people";
  rank?: number;
}) {
  const href = `/article/${story.slug}`;
  const video = isVideoStory(story);
  const category = displayCategory(story.category);

  if (variant === "hero") {
    return (
      <Link href={href} className="group block">
        <Cover
          story={story}
          eager
          className="aspect-[16/10] w-full sm:aspect-[16/8] lg:aspect-[16/7.2]"
        />
        <div className="mt-5 sm:mt-6">
          <p className="text-[11px] font-medium tracking-[0.16em] text-[#d3b176]">
            {category}
            {video ? " · 影音" : ""}
            <span className="mx-2 text-zinc-700">/</span>
            {formatStoryDate(story.publishedAt)}
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-news-serif)] text-[1.75rem] leading-tight tracking-[-0.035em] text-white sm:text-5xl sm:leading-[1.12] lg:text-[3.35rem]">
            {story.title}
          </h2>
          {story.summary ? (
            <p className="mt-4 max-w-3xl text-[15px] leading-8 text-zinc-400 sm:mt-5 sm:text-lg sm:leading-9">
              {story.summary}
            </p>
          ) : null}
        </div>
      </Link>
    );
  }

  if (variant === "ranking") {
    return (
      <Link
        href={href}
        className="group flex items-start gap-3 border-b border-white/[0.07] py-3.5 last:border-0"
      >
        <span className="w-7 shrink-0 font-[family-name:var(--font-news-serif)] text-xl leading-none text-[#d3b176]">
          {String(rank ?? 0).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] tracking-[0.14em] text-zinc-500">
            {category}
          </p>
          <h3 className="mt-1 text-[15px] font-medium leading-6 text-zinc-100 group-hover:text-white">
            {story.title}
          </h3>
        </div>
        {story.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.coverImage}
            alt=""
            className="size-[4.25rem] shrink-0 object-cover"
          />
        ) : null}
      </Link>
    );
  }

  if (variant === "people") {
    return (
      <Link href={href} className="group block">
        <Cover story={story} className="aspect-[4/5] sm:aspect-[3/4]" />
        <div className="pt-4">
          <p className="text-[11px] tracking-[0.12em] text-[#d3b176]">
            {category}
            <span className="mx-1.5 text-zinc-700">·</span>
            {formatStoryDate(story.publishedAt)}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-news-serif)] text-[1.35rem] leading-8 tracking-[-0.03em] text-white group-hover:text-[#f4efe6] sm:text-[1.5rem] sm:leading-9">
            {story.title}
          </h2>
          {story.summary ? (
            <p className="mt-3 line-clamp-3 text-sm leading-7 text-zinc-500">
              {story.summary}
            </p>
          ) : null}
        </div>
      </Link>
    );
  }

  if (variant === "row") {
    return (
      <Link href={href} className="group flex gap-4 py-4">
        {story.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.coverImage}
            alt=""
            className="h-[4.75rem] w-[7.25rem] shrink-0 object-cover sm:h-24 sm:w-36"
          />
        ) : (
          <div className="grid h-[4.75rem] w-[7.25rem] shrink-0 place-items-center bg-white/[0.04] sm:h-24 sm:w-36">
            <Newspaper className="size-5 text-zinc-600" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-[#d3b176]">
            {category}
            {video ? " · 影音" : ""} · {formatStoryDate(story.publishedAt)}
          </p>
          <h3 className="mt-1.5 text-[15px] font-medium leading-6 text-zinc-100 group-hover:text-white sm:text-base sm:leading-7">
            {story.title}
          </h3>
        </div>
      </Link>
    );
  }

  const largeVideo = variant === "video";

  return (
    <Link href={href} className="group block">
      <Cover
        story={story}
        showPlay={largeVideo}
        className={largeVideo ? "aspect-[16/9]" : "aspect-[16/10]"}
      />
      <div className={cn("pt-4", largeVideo && "pt-5")}>
        <p className="text-[11px] tracking-[0.12em] text-[#d3b176]">
          {video ? "影音" : category}
          <span className="mx-1.5 text-zinc-700">·</span>
          {formatStoryDate(story.publishedAt)}
        </p>
        <h2
          className={cn(
            "mt-2 text-white group-hover:text-[#f4efe6]",
            variant === "featured" || largeVideo
              ? "font-[family-name:var(--font-news-serif)] text-2xl leading-8 tracking-[-0.03em] sm:text-[1.75rem] sm:leading-9"
              : "text-[17px] font-semibold leading-7 tracking-[-0.02em]",
          )}
        >
          {story.title}
        </h2>
        {story.summary && (variant === "featured" || largeVideo) ? (
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-zinc-500">
            {story.summary}
          </p>
        ) : story.summary ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
            {story.summary}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function SectionHeading({
  kicker,
  title,
  href,
  action = "看更多",
}: {
  kicker?: string;
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-white/[0.08] pb-3">
      <div>
        {kicker ? (
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#d3b176]">
            {kicker}
          </p>
        ) : null}
        <h2 className="mt-1 font-[family-name:var(--font-news-serif)] text-2xl tracking-[-0.03em] sm:text-[1.75rem]">
          {title}
        </h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="mb-0.5 shrink-0 text-xs tracking-wide text-zinc-500 hover:text-white"
        >
          {action}
        </Link>
      ) : null}
    </div>
  );
}

export function EmptyStories({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-white/10 px-6 py-16 text-center">
      <Newspaper className="mx-auto size-6 text-zinc-700" />
      <p className="mt-4 text-sm text-zinc-600">{message}</p>
    </div>
  );
}
