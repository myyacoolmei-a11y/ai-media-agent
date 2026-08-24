import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdSlot } from "@/components/public/ad-slot";
import { ArticleBody } from "@/components/public/article-body";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/brand";
import { getAdsForPlacement } from "@/lib/ads/serve";
import { hasRenderableBlocks } from "@/lib/content/blocks";
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
  const category = displayCategory(story.category);
  const sectionHref = categoryHref(story.category);
  const [
    topAds,
    inlineAds,
    bottomAds,
    sidebarAds,
    videoAds,
    sponsorAds,
  ] = await Promise.all([
    getAdsForPlacement("article_top"),
    getAdsForPlacement("article_inline", 2),
    getAdsForPlacement("article_bottom"),
    getAdsForPlacement("article_sidebar"),
    getAdsForPlacement("video"),
    getAdsForPlacement("sponsor", 4),
  ]);
  const hasBlocks = hasRenderableBlocks(story.blocks);
  const showLegacyCover = !hasBlocks && Boolean(story.coverImage);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,52rem)_18rem] lg:items-start lg:justify-center lg:gap-12">
      <article className="article-media mx-auto w-full max-w-[52rem]">
        <p className="text-xs text-[#d3b176]">
          <Link href={sectionHref} className="hover:text-white">
            {category}
          </Link>
          {isVideoStory(story) ? " · 影音" : ""} · {formatStoryDate(story.publishedAt)}
        </p>
        {story.sponsored ? (
          <p className="mt-4 inline-flex rounded-full border border-[#d3b176]/30 bg-[#d3b176]/10 px-3 py-1 text-[11px] tracking-wide text-[#d3b176]">
            {story.sponsorLabel ||
              (story.sponsorName
                ? `本篇內容由 ${story.sponsorName} 合作呈現`
                : "品牌合作")}
          </p>
        ) : null}
        <h1 className="mt-5 font-[family-name:var(--font-news-serif)] text-3xl leading-tight tracking-[-0.03em] sm:text-5xl">
          {story.title}
        </h1>
        {story.summary ? (
          <p className="mt-6 text-lg leading-8 text-zinc-400">{story.summary}</p>
        ) : null}

        <div className="mt-8">
          <AdSlot ads={topAds} placementKey="article_top" articleId={story.id} />
        </div>

        {showLegacyCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.coverImage ?? ""}
            alt={story.title}
            className="mt-10 h-auto w-full rounded-2xl object-cover"
          />
        ) : null}

        {isVideoStory(story) && !hasBlocks ? (
          <div className="mt-8">
            <AdSlot ads={videoAds} placementKey="video" articleId={story.id} />
          </div>
        ) : null}

        <ArticleBody
          story={story}
          inlineAds={inlineAds}
          videoAds={hasBlocks ? videoAds : []}
        />

        <div className="mt-10 lg:hidden">
          <AdSlot
            ads={sidebarAds}
            placementKey="article_sidebar"
            articleId={story.id}
            variant="feed"
          />
        </div>

        <div className="mt-10">
          <AdSlot ads={bottomAds} placementKey="article_bottom" articleId={story.id} />
        </div>

        <div className="mt-8">
          <AdSlot
            ads={sponsorAds}
            placementKey="sponsor"
            articleId={story.id}
            variant="sponsor"
          />
        </div>

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

      <aside className="mt-12 hidden lg:sticky lg:top-8 lg:mt-0 lg:block">
        <AdSlot
          ads={sidebarAds}
          placementKey="article_sidebar"
          articleId={story.id}
          variant="sidebar"
        />
        <div className="mt-6">
          <AdSlot
            ads={sponsorAds}
            placementKey="sponsor"
            articleId={story.id}
            variant="sponsor"
          />
        </div>
      </aside>
    </div>
  );
}
