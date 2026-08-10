import { notFound } from "next/navigation";

import { ContentPreviewActions } from "@/components/content-preview-actions";
import {
  loadContentWithAssets,
  verifyContentAccess,
} from "@/lib/content/access";
import { contentTypeLabels } from "@/types/content";

type PreviewPageProps = {
  params: Promise<{ contentId: string }>;
};

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { contentId } = await params;
  const access = await verifyContentAccess(contentId);
  if (!access) notFound();
  const content = await loadContentWithAssets(access.content);

  return (
    <div className="mx-auto max-w-4xl">
      <ContentPreviewActions contentId={contentId} />
      <article className="overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#100f10]">
        {content.cover_image && (
          // Signed Supabase URL is dynamic and cannot be preconfigured for next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={content.cover_image}
            alt={content.title}
            className="aspect-[16/8] w-full object-cover"
          />
        )}
        <div className="px-6 py-10 sm:px-12 sm:py-14">
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#d3b176]">
            <span>{contentTypeLabels[content.content_type]}</span>
            <span>·</span>
            <span>{content.category}</span>
            <span>·</span>
            <span>預覽</span>
          </div>
          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
            {content.title || "未命名內容"}
          </h1>
          <p className="mt-6 text-base leading-8 text-zinc-400">
            {content.summary}
          </p>
          <div className="mt-10 whitespace-pre-wrap border-t border-white/[0.07] pt-10 text-[15px] leading-8 text-zinc-300">
            {content.content}
          </div>

          {content.assets?.filter((asset) => asset.id !== content.cover_asset_id)
            .length ? (
            <div className="mt-10 grid gap-4">
              {content.assets
                .filter((asset) => asset.id !== content.cover_asset_id)
                .map((asset) =>
                  asset.asset_type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={asset.id}
                      src={asset.signed_url}
                      alt={asset.alt_text || asset.file_name}
                      className="w-full rounded-2xl"
                    />
                  ) : (
                    <video
                      key={asset.id}
                      src={asset.signed_url}
                      controls
                      className="w-full rounded-2xl bg-black"
                    />
                  ),
                )}
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}
