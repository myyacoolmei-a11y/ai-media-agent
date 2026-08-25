import { notFound } from "next/navigation";

import { ArticleBody } from "@/components/public/article-body";
import { ContentPreviewActions } from "@/components/content-preview-actions";
import {
  loadContentWithAssets,
  verifyContentAccess,
} from "@/lib/content/access";
import { contentToPreviewStory } from "@/lib/content/preview-story";
import { contentTypeLabels } from "@/types/content";

type PreviewPageProps = {
  params: Promise<{ contentId: string }>;
};

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { contentId } = await params;
  const access = await verifyContentAccess(contentId);
  if (!access) notFound();
  const content = await loadContentWithAssets(access.content);
  const story = contentToPreviewStory(content);

  return (
    <div className="mx-auto max-w-4xl">
      <ContentPreviewActions contentId={contentId} />
      <article className="article-media overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#100f10] px-6 py-10 sm:px-12 sm:py-14">
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#d3b176]">
          <span>{contentTypeLabels[content.content_type]}</span>
          <span>·</span>
          <span>{content.category}</span>
          <span>·</span>
          <span>預覽</span>
        </div>
        {story.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.coverImage}
            alt={story.title}
            className="mt-6 h-auto w-full rounded-2xl"
          />
        ) : null}
        <h1 className="mt-5 font-[family-name:var(--font-news-serif)] text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
          {content.title || "未命名內容"}
        </h1>
        <p className="mt-6 text-base leading-8 text-zinc-400">{content.summary}</p>
        <ArticleBody story={story} inlineAds={[]} />
      </article>
    </div>
  );
}
