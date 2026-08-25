import { notFound } from "next/navigation";
import Link from "next/link";

import { ArticleBody } from "@/components/public/article-body";
import {
  loadContentWithAssets,
  verifyContentAccess,
} from "@/lib/content/access";
import { contentToPreviewStory } from "@/lib/content/preview-story";

type PreviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminArticlePreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const access = await verifyContentAccess(id);
  if (!access) notFound();
  const content = await loadContentWithAssets(access.content);
  const story = contentToPreviewStory(content);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">預覽（不會公開，除非已發布）</p>
        <Link href={`/admin/content/${id}/edit`} className="text-xs text-[#d3b176]">
          返回編輯
        </Link>
      </div>
      <article className="article-media mx-auto w-full max-w-[52rem]">
        {story.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.coverImage}
            alt={story.title}
            className="mb-8 h-auto w-full rounded-2xl"
          />
        ) : null}
        <h1 className="font-[family-name:var(--font-news-serif)] text-3xl leading-tight tracking-[-0.03em] sm:text-5xl">
          {story.title || "未命名報導"}
        </h1>
        {story.summary ? (
          <p className="mt-6 text-lg leading-8 text-zinc-400">{story.summary}</p>
        ) : null}
        <ArticleBody story={story} inlineAds={[]} />
      </article>
    </div>
  );
}
