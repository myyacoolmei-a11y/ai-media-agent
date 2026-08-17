import { Newspaper, Play } from "lucide-react";
import Link from "next/link";

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

  if (variant === "row") {
    return (
      <Link
        href={href}
        className="group flex gap-4 border-b border-white/[0.06] py-4 last:border-0"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-[#d3b176]">
            {video ? "影音" : "報導"} · {formatStoryDate(story.publishedAt)}
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
            className="size-16 shrink-0 rounded-xl object-cover"
          />
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025] transition hover:-translate-y-0.5 hover:border-white/15",
        variant === "featured" && "sm:grid sm:grid-cols-[1.3fr_1fr]",
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
              variant === "featured" ? "aspect-[16/10] sm:h-full" : "aspect-[16/10]",
            )}
          />
        ) : (
          <div
            className={cn(
              "grid place-items-center bg-white/[0.02]",
              variant === "featured" ? "aspect-[16/10] sm:h-full" : "aspect-[16/10]",
            )}
          >
            {video ? (
              <Play className="size-7 text-zinc-700" />
            ) : (
              <Newspaper className="size-7 text-zinc-700" />
            )}
          </div>
        )}
        {video ? (
          <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] text-white">
            影音
          </span>
        ) : null}
      </div>
      <div className={cn("p-5", variant === "featured" && "sm:flex sm:flex-col sm:justify-center sm:p-8")}>
        <p className="text-[11px] text-[#d3b176]">
          {formatStoryDate(story.publishedAt)}
        </p>
        <h2
          className={cn(
            "mt-2 font-semibold tracking-[-0.03em] text-white",
            variant === "featured"
              ? "text-2xl leading-8 sm:text-3xl sm:leading-10"
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
    <div className="rounded-3xl border border-dashed border-white/10 px-6 py-16 text-center">
      <Newspaper className="mx-auto size-6 text-zinc-700" />
      <p className="mt-4 text-sm text-zinc-600">{message}</p>
    </div>
  );
}
