import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { EmptyStories, StoryCard } from "@/components/public/story-card";
import { SITE_NAME } from "@/lib/brand";
import {
  getSectionBySlug,
  getTopicBySlug,
} from "@/lib/content/categories";
import { listPublishedStories } from "@/lib/content/published";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ topic?: string | string[] }>;
};

function topicParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "video") return { title: "影音報導" };
  const section = getSectionBySlug(slug);
  if (!section) return { title: "找不到分類" };
  const topic = getTopicBySlug(section, topicParam((await searchParams).topic));
  const title = topic ? `${section.label} · ${topic.label}` : section.label;
  return {
    title,
    description: `${SITE_NAME}｜${title}報導`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  if (slug === "video") redirect("/video");

  const section = getSectionBySlug(slug);
  if (!section || section.slug === "video") notFound();

  const requestedTopic = topicParam((await searchParams).topic);
  const topic = getTopicBySlug(section, requestedTopic);
  if (requestedTopic && !topic) notFound();

  const stories = await listPublishedStories({
    limit: 40,
    section: section.label,
    topic: topic?.label,
  });

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.22em] text-[#d3b176]">
        Category
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-news-serif)] text-3xl tracking-[-0.03em] sm:text-4xl">
        {topic ? `${section.label} · ${topic.label}` : section.label}
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
        依發布時間排序，只顯示已正式發布的內容。
      </p>

      {section.topics.length ? (
        <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto overscroll-x-contain pb-1">
          <FilterChip
            href={section.href}
            label="全部"
            active={!topic}
          />
          {section.topics.map((item) => (
            <FilterChip
              key={item.slug}
              href={`${section.href}?topic=${encodeURIComponent(item.slug)}`}
              label={item.label}
              active={topic?.slug === item.slug}
            />
          ))}
        </div>
      ) : null}

      {stories.length ? (
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <StoryCard
              key={story.slug}
              story={story}
              variant={section.slug === "people" ? "people" : "grid"}
            />
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyStories
            message={
              topic
                ? `目前還沒有「${section.label} · ${topic.label}」的已發布報導。`
                : `目前還沒有「${section.label}」的已發布報導。`
            }
          />
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 border px-3 py-1.5 text-sm tracking-wide",
        active
          ? "border-[#d3b176] bg-[#d3b176]/10 text-white"
          : "border-white/10 text-zinc-400 hover:text-white",
      )}
    >
      {label}
    </Link>
  );
}
