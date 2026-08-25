import type { ContentItem, PublicContentItem } from "@/types/content";

export function contentToPreviewStory(content: ContentItem): PublicContentItem {
  return {
    id: content.id,
    title: content.title,
    slug: content.slug,
    summary: content.summary,
    content: content.content,
    videoUrl: content.video_url,
    coverImage: content.cover_image ?? null,
    category: content.category,
    contentType: content.content_type,
    status: "published",
    publishedAt: content.published_at ?? content.updated_at,
    sponsored: Boolean(content.sponsored),
    sponsorLabel: content.sponsor_label ?? null,
    sponsorName: null,
    blocks: content.blocks,
    media: (content.assets ?? []).map((asset) => ({
      type: asset.asset_type,
      url: asset.signed_url ?? "",
      alt: asset.alt_text,
    })),
  };
}
