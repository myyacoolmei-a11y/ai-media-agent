import { addSignedAssetUrls } from "@/lib/content/access";
import { hydrateBlockMedia, loadArticleBlocks } from "@/lib/content/blocks";
import { isMissingRelation } from "@/lib/db/missing";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ContentAsset,
  ContentItem,
  PublicContentItem,
} from "@/types/content";

export async function serializePublicContent(
  content: ContentItem,
): Promise<PublicContentItem> {
  const { data } = await createAdminClient()
    .from("content_assets")
    .select("*")
    .eq("content_item_id", content.id)
    .eq("status", "ready")
    .order("sort_order", { ascending: true });
  const assets = await addSignedAssetUrls(
    (data ?? []) as ContentAsset[],
    60 * 60 * 24,
  );
  const cover = assets.find((asset) => asset.id === content.cover_asset_id);
  const rawBlocks = await loadArticleBlocks(content.id);
  const blocks = await hydrateBlockMedia(rawBlocks);

  let sponsorName: string | null = null;
  if (content.sponsor_id) {
    try {
      const { data: advertiser } = await createAdminClient()
        .from("advertisers")
        .select("name")
        .eq("id", content.sponsor_id)
        .maybeSingle();
      sponsorName = advertiser?.name ?? null;
    } catch (error) {
      if (!(error instanceof Error && isMissingRelation(error))) {
        console.error("Failed to load sponsor", error);
      }
    }
  }

  const firstBlockImage = blocks.find(
    (block) =>
      (block.type === "image" || block.type === "gallery") &&
      (block.thumbnail_url || block.media_url || Array.isArray(block.metadata?.items)),
  );
  const coverBlock = blocks.find((block) => block.metadata?.cover) ?? firstBlockImage;

  return {
    id: content.id,
    title: content.title,
    slug: content.slug,
    summary: content.summary,
    content: content.content,
    videoUrl: content.video_url,
    coverImage:
      cover?.signed_url ??
      (typeof coverBlock?.metadata?.items === "object" &&
      Array.isArray(coverBlock.metadata.items) &&
      typeof (coverBlock.metadata.items[0] as { url?: string } | undefined)?.url === "string"
        ? (coverBlock.metadata.items[0] as { url: string }).url
        : null) ??
      coverBlock?.thumbnail_url ??
      coverBlock?.media_url ??
      null,
    category: content.category,
    contentType: content.content_type,
    status: "published",
    publishedAt: content.published_at as string,
    sponsored: Boolean(content.sponsored),
    sponsorLabel: content.sponsor_label || null,
    sponsorName,
    blocks,
    media: assets.map((asset) => ({
      type: asset.asset_type,
      url: asset.signed_url ?? "",
      alt: asset.alt_text,
    })),
  };
}
