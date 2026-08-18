import { getPreviewDemoContentItem } from "@/lib/content/preview-demo";
import { getBrandContext } from "@/lib/brands/access";
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
    const context = await getBrandContext(user);
    if (!context) return null;
    return {
      user,
      supabase: null,
      content,
      brand: context.brand,
      context,
    };
  }

  const context = await getBrandContext(user);
  if (!context) return null;

  const supabase = createAdminClient();
  const { data: content, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", contentId)
    .maybeSingle();

  if (error || !content) return null;
  const item = content as ContentItem;
  if (!context.brands.some((brand) => brand.id === item.brand_id)) return null;
  return { user, supabase, content: item, brand: context.brand, context };
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
  expiresIn = 3600,
) {
  if (isPreviewDemo()) {
    return {
      ...content,
      assets: [] as ContentAsset[],
      cover_image: content.cover_image ?? null,
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

  return {
    ...content,
    assets,
    cover_image: cover?.signed_url ?? null,
  };
}