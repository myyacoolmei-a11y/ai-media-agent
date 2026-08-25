import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleBody } from "@/components/public/article-body";
import { StoryVideo } from "@/components/public/story-video";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/brand";
import { categoryHref, displayCategory } from "@/lib/content/categories";
import { formatStoryDate } from "@/lib/content/dates";
import { getPublishedStory } from "@/lib/content/published";
import { isVideoStory } from "@/lib/content/video";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPublishedStory(slug);
  if (!story) return { title: "找不到報導" };
  return {
    title: story.title,
    description: story.summary || undefined,
    openGraph: {
      title: story.title,
      description: story.summary || SITE_DESCRIPTION,
      siteName: SITE_NAME,
      locale: "zh_TW",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description: story.summary || SITE_DESCRIPTION,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const story = await getPublishedStory(slug);
  if (!story) notFound();
  const videoMedia = story.media.find((item) => item.type === "video" && item.url);
  const category = displayCategory(story.category);
  const sectionHref = categoryHref(story.category);

  return (
    <article className="mx-auto max-w-3xl">
      <p className="text-xs text-[#d3b176]">
        <Link href={sectionHref} className="hover:text-white">
          {category}
        </Link>
        {isVideoStory(story) ? " · 影音" : ""} · {formatStoryDate(story.publishedAt)}
      </p>
      <h1 className="mt-5 font-[family-name:var(--font-news-serif)] text-3xl leading-tight tracking-[-0.03em] sm:text-5xl">
        {story.title}
      </h1>
      {story.summary ? (
        <p className="mt-6 text-lg leading-8 text-zinc-400">{story.summary}</p>
      ) : null}

      {story.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={story.coverImage}
          alt={story.title}
          className="mt-10 aspect-[16/9] w-full rounded-2xl object-cover"
        />
      ) : null}

      <div className="mt-8 space-y-6">
        {videoMedia ? (
          <video
            src={videoMedia.url}
            controls
            className="aspect-video w-full rounded-2xl bg-black"
          />
        ) : null}
        {story.videoUrl ? (
          <StoryVideo url={story.videoUrl} title={story.title} />
        ) : null}
      </div>

      {story.articleBlocks?.length ? (
        <ArticleBody blocks={story.articleBlocks} title={story.title} />
      ) : story.content ? (
        <div className="mt-12 whitespace-pre-wrap border-t border-white/[0.07] pt-10 text-base leading-9 text-zinc-300">
          {story.content}
        </div>
      ) : null}

      <div className="mt-12 flex flex-wrap gap-4 text-xs text-zinc-600">
        <Link href="/news" className="hover:text-white">
          返回最新報導
        </Link>
        {isVideoStory(story) ? (
          <Link href="/video" className="hover:text-white">
            返回影音報導
          </Link>
        ) : null}
      </div>
    </article>
  );
}
