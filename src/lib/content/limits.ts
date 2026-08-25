/** Single source of truth for article media caps. Do not copy these numbers elsewhere. */
export const MAX_ARTICLE_IMAGES = 20;
export const MAX_ARTICLE_VIDEOS = 5;
export const MAX_IMAGE_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 200 * 1024 * 1024;
export const ARTICLE_IMAGE_MAX_WIDTH = 1600;

export type CountableBlock = {
  type: string;
  metadata?: Record<string, unknown>;
};

export function countArticleImages(blocks: CountableBlock[]) {
  return blocks.reduce((sum, block) => {
    if (block.type === "image") return sum + 1;
    if (block.type === "gallery") {
      const items = Array.isArray(block.metadata?.items)
        ? block.metadata.items.length
        : 0;
      return sum + items;
    }
    return sum;
  }, 0);
}

export function countArticleVideos(blocks: CountableBlock[]) {
  return blocks.filter(
    (block) => block.type === "video" || block.type === "embed",
  ).length;
}

export function blockHasPublishableBody(block: {
  type: string;
  content?: string | null;
  mediaUrl?: string | null;
  media_url?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  if (block.content?.trim()) return true;
  if (block.mediaUrl || block.media_url) return true;
  const meta = block.metadata ?? {};
  if (typeof meta.storagePath === "string" && meta.storagePath) return true;
  if (typeof meta.url === "string" && meta.url.trim()) return true;
  if (Array.isArray(meta.items) && meta.items.length > 0) return true;
  return false;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
