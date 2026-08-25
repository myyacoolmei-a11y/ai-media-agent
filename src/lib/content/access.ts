import { hydrateArticleBlocksFromContent } from "@/lib/content/article-blocks";
import { getPreviewDemoContentItem } from "@/lib/content/preview-demo";
import { getAuthenticatedUser } from "@/lib/jobs/access";
import { isPreviewDemo } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentAsset, ContentItem } from "@/types/content";

export async function verifyContentAccess(contentId: string) {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  if (isPreviewDemo()) {
    const content = getPreviewDemoContentItem(contentId);
    if (!content) return null;
    return { user, supabase: null, content };
  }

  const supabase = createAdminClient();
  const { data: content, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", contentId)
    .eq("user_id", user.id)
    .single();

  if (error || !content) return null;
  return { user, supabase, content: content as ContentItem };
}

export async function addSignedAssetUrls<T extends ContentAsset>(
  assets: T[],
  expiresIn = 3600,
) {
  const supabase = createAdminClient();
  return Promise.all(
    assets.map(async (asset) => {
      const { data } = await supabase.storage
        .from(asset.bucket)
        .createSignedUrl(asset.storage_path, expiresIn);
      return { ...asset, signed_url: data?.signedUrl };
    }),
  );
}

export async function loadContentWithAssets(
  content: ContentItem,
  expiresIn = 60 * 60 * 24,
) {
  if (isPreviewDemo()) {
    const hydrated = {
      ...content,
      assets: [] as ContentAsset[],
      cover_image: content.cover_image ?? null,
    };
    return {
      ...hydrated,
      article_blocks: hydrateArticleBlocksFromContent(hydrated),
    };
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("content_assets")
    .select("*")
    .eq("content_item_id", content.id)
    .eq("status", "ready")
    .order("sort_order", { ascending: true });
  const assets = await addSignedAssetUrls(
    (data ?? []) as ContentAsset[],
    expiresIn,
  );
  const cover =
    assets.find((asset) => asset.id === content.cover_asset_id) ?? null;

  const hydrated = {
    ...content,
    assets,
    cover_image: cover?.signed_url ?? null,
  };
  return {
    ...hydrated,
    article_blocks: hydrateArticleBlocksFromContent(hydrated),
  };
}
