import { addSignedAssetUrls } from "@/lib/content/access";
import { hydrateBlockMedia, loadArticleBlocks } from "@/lib/content/blocks";
import { isMissingRelation } from "@/lib/db/missing";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ArticleBlock } from "@/types/blocks";
import type {
  ContentAsset,
  ContentItem,
  PublicContentItem,
} from "@/types/content";

function relatedSlugs(block: ArticleBlock) {
  if (Array.isArray(block.metadata?.slugs)) {
    return (block.metadata.slugs as unknown[])
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return String(block.content)
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function attachRelatedTitles(blocks: ArticleBlock[]): Promise<ArticleBlock[]> {
  const slugs = [
    ...new Set(
      blocks
        .filter((block) => block.type === "related_articles")
        .flatMap(relatedSlugs),
    ),
  ];
  if (!slugs.length) return blocks;
  try {
    const { data } = await createAdminClient()
      .from("content_items")
      .select("slug,title")
      .in("slug", slugs)
      .eq("status", "published");
    const titles = new Map((data ?? []).map((row) => [row.slug, row.title]));
    return blocks.map((block) => {
      if (block.type !== "related_articles") return block;
      return {
        ...block,
        metadata: {
          ...block.metadata,
          related: relatedSlugs(block).map((slug) => ({
            slug,
            title: titles.get(slug) ?? slug,
          })),
        },
      };
    });
  } catch (error) {
    if (error instanceof Error && isMissingRelation(error)) return blocks;
    console.error("Failed to load related articles", error);
    return blocks;
  }
}

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
  const blocks = await attachRelatedTitles(await hydrateBlockMedia(rawBlocks));

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

  return {
    id: content.id,
    title: content.title,
    slug: content.slug,
    summary: content.summary,
    content: content.content,
    videoUrl: content.video_url,
    coverImage: cover?.signed_url ?? null,
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
