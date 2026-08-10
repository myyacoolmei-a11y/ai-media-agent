import { addSignedAssetUrls } from "@/lib/content/access";
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

  return {
    title: content.title,
    slug: content.slug,
    summary: content.summary,
    content: content.content,
    coverImage: cover?.signed_url ?? null,
    category: content.category,
    contentType: content.content_type,
    status: "published",
    publishedAt: content.published_at as string,
    media: assets.map((asset) => ({
      type: asset.asset_type,
      url: asset.signed_url ?? "",
      alt: asset.alt_text,
    })),
  };
}
