import { isMissingRelation } from "@/lib/db/missing";
import { signMediaPath } from "@/lib/media/sign";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ArticleBlock } from "@/types/blocks";
import type { ContentItem } from "@/types/content";

export function blocksToPlainText(blocks: ArticleBlock[]) {
  return blocks
    .filter((block) => block.type === "text" || block.type === "heading" || block.type === "quote")
    .map((block) => block.content.trim())
    .filter(Boolean)
    .join("\n\n");
}

export function hasRenderableBlocks(blocks: ArticleBlock[] | undefined) {
  return Boolean(blocks?.length);
}

export function legacyBlocksFromContent(content: ContentItem): ArticleBlock[] {
  const now = content.updated_at;
  const blocks: ArticleBlock[] = [];
  if (content.content?.trim()) {
    blocks.push({
      id: `legacy-text-${content.id}`,
      article_id: content.id,
      type: "text",
      sort_order: blocks.length,
      content: content.content,
      media_url: null,
      thumbnail_url: null,
      caption: "",
      source: "",
      alt_text: "",
      metadata: { legacy: true },
      created_at: now,
      updated_at: now,
    });
  }
  if (content.video_url) {
    blocks.push({
      id: `legacy-embed-${content.id}`,
      article_id: content.id,
      type: "embed",
      sort_order: blocks.length,
      content: "",
      media_url: content.video_url,
      thumbnail_url: null,
      caption: "",
      source: "",
      alt_text: "",
      metadata: { legacy: true, url: content.video_url },
      created_at: now,
      updated_at: now,
    });
  }
  return blocks;
}

export async function loadArticleBlocks(articleId: string): Promise<ArticleBlock[]> {
  try {
    const { data, error } = await createAdminClient()
      .from("article_blocks")
      .select("*")
      .eq("article_id", articleId)
      .order("sort_order", { ascending: true });
    if (error) {
      if (isMissingRelation(error)) return [];
      throw new Error(error.message);
    }
    return (data ?? []).map((row) => {
      const block = row as ArticleBlock;
      if (block.metadata?.kind === "divider") {
        return { ...block, type: "divider" };
      }
      return block;
    });
  } catch (error) {
    if (error instanceof Error && isMissingRelation(error)) return [];
    throw error;
  }
}

export async function hydrateBlockMedia(blocks: ArticleBlock[]): Promise<ArticleBlock[]> {
  return Promise.all(
    blocks.map(async (block) => {
      const meta = block.metadata ?? {};
      const bucket = typeof meta.bucket === "string" ? meta.bucket : "content-media";
      const path = typeof meta.storagePath === "string" ? meta.storagePath : null;
      const isVideo = block.type === "video";
      let mediaUrl = block.media_url;
      let thumb = block.thumbnail_url;
      if (path) {
        mediaUrl =
          (await signMediaPath(bucket, path, isVideo ? null : 1400)) ?? mediaUrl;
        if (!isVideo) {
          thumb = (await signMediaPath(bucket, path, 640)) ?? thumb ?? mediaUrl;
        }
      }
      const posterPath = typeof meta.posterPath === "string" ? meta.posterPath : null;
      const posterBucket =
        typeof meta.posterBucket === "string" ? meta.posterBucket : bucket;
      if (posterPath) {
        thumb = (await signMediaPath(posterBucket, posterPath, 1200)) ?? thumb;
      }
      const items = Array.isArray(meta.items)
        ? await Promise.all(
            meta.items.map(async (item) => {
              if (!item || typeof item !== "object") return item;
              const row = item as Record<string, unknown>;
              const itemPath = typeof row.storagePath === "string" ? row.storagePath : null;
              const itemBucket = typeof row.bucket === "string" ? row.bucket : bucket;
              if (!itemPath) return row;
              const url = await signMediaPath(itemBucket, itemPath, 1200);
              return { ...row, url: url ?? row.url };
            }),
          )
        : meta.items;
      return {
        ...block,
        media_url: mediaUrl,
        thumbnail_url: thumb,
        metadata: { ...meta, items: items ?? meta.items },
      };
    }),
  );
}

export function galleryLayoutClass(layout: string | undefined) {
  if (layout === "two") return "grid grid-cols-1 gap-3 sm:grid-cols-2";
  if (layout === "three") return "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3";
  if (layout === "carousel") {
    return "flex snap-x gap-3 overflow-x-auto pb-2";
  }
  if (layout === "gallery") {
    return "grid grid-cols-2 gap-2 sm:grid-cols-3";
  }
  return "grid grid-cols-1 gap-3";
}
