import type { ContentAsset } from "@/types/content";
import { z } from "zod";

export const MAX_ARTICLE_IMAGE_BLOCKS = 20;
export const MAX_ARTICLE_IMAGE_BLOCKS_MESSAGE = "每篇文章最多 20 張內文圖片";

const textBlockSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.literal("text"),
  data: z.object({
    text: z.string().max(100_000),
  }),
});

const imageBlockSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.literal("image"),
  data: z.object({
    url: z.string().max(4000).optional().default(""),
    caption: z.string().max(500).optional().default(""),
    assetId: z.string().uuid().nullable().optional(),
  }),
});

export const articleBlockSchema = z.discriminatedUnion("type", [
  textBlockSchema,
  imageBlockSchema,
]);

export const articleBlocksSchema = z.array(articleBlockSchema).max(80);

export type ArticleTextBlock = z.infer<typeof textBlockSchema>;
export type ArticleImageBlock = z.infer<typeof imageBlockSchema>;
export type ArticleBlock = z.infer<typeof articleBlockSchema>;

export type PublicArticleBlock =
  | { type: "text"; data: { text: string } }
  | { type: "image"; data: { url: string; caption: string } };

function newBlockId() {
  return crypto.randomUUID();
}

export function emptyTextBlock(text = ""): ArticleTextBlock {
  return { id: newBlockId(), type: "text", data: { text } };
}

export function emptyImageBlock(): ArticleImageBlock {
  return {
    id: newBlockId(),
    type: "image",
    data: { url: "", caption: "", assetId: null },
  };
}

export function countImageBlocks(blocks: ArticleBlock[]) {
  return blocks.filter((block) => block.type === "image").length;
}

export function withoutCoverImageBlocks(
  blocks: ArticleBlock[],
  coverAssetId?: string | null,
) {
  if (!coverAssetId) return blocks;
  return blocks.filter(
    (block) => !(block.type === "image" && block.data.assetId === coverAssetId),
  );
}

export function blocksToPlainText(blocks: ArticleBlock[]) {
  return blocks
    .filter((block): block is ArticleTextBlock => block.type === "text")
    .map((block) => block.data.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

export function hasPublishableArticleBody(blocks: ArticleBlock[]) {
  return blocks.some((block) => {
    if (block.type === "text") return Boolean(block.data.text.trim());
    return Boolean(block.data.assetId || block.data.url);
  });
}

function normalizeBlock(input: unknown): ArticleBlock | null {
  const parsed = articleBlockSchema.safeParse(input);
  if (parsed.success) return parsed.data;
  if (!input || typeof input !== "object") return null;
  const row = input as Record<string, unknown>;
  const type = row.type;
  const data =
    row.data && typeof row.data === "object"
      ? (row.data as Record<string, unknown>)
      : {};
  const id = typeof row.id === "string" && row.id ? row.id : newBlockId();
  if (type === "text") {
    const text =
      typeof data.text === "string"
        ? data.text
        : typeof row.content === "string"
          ? row.content
          : "";
    return { id, type: "text", data: { text } };
  }
  if (type === "image") {
    const url =
      typeof data.url === "string"
        ? data.url
        : typeof row.media_url === "string"
          ? row.media_url
          : "";
    const caption =
      typeof data.caption === "string"
        ? data.caption
        : typeof row.caption === "string"
          ? row.caption
          : "";
    const assetId =
      typeof data.assetId === "string"
        ? data.assetId
        : typeof data.asset_id === "string"
          ? data.asset_id
          : null;
    const parsedImage = imageBlockSchema.safeParse({
      id,
      type: "image",
      data: { url, caption, assetId },
    });
    return parsedImage.success ? parsedImage.data : null;
  }
  return null;
}

export function parseArticleBlocks(raw: unknown): ArticleBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeBlock(item))
    .filter((block): block is ArticleBlock => Boolean(block));
}

export function toStoredArticleBlocks(blocks: ArticleBlock[]): ArticleBlock[] {
  return blocks.map((block) => {
    if (block.type === "text") {
      return {
        id: block.id,
        type: "text",
        data: { text: block.data.text },
      };
    }
    return {
      id: block.id,
      type: "image",
      data: {
        url: "",
        caption: block.data.caption ?? "",
        assetId: block.data.assetId ?? null,
      },
    };
  });
}

export function hydrateArticleBlocks(
  raw: unknown,
  fallbackContent = "",
  assets: ContentAsset[] = [],
): ArticleBlock[] {
  const parsed = parseArticleBlocks(raw);
  const blocks = parsed.length
    ? parsed
    : fallbackContent
      ? [emptyTextBlock(fallbackContent)]
      : [emptyTextBlock()];
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  return blocks.map((block) => {
    if (block.type !== "image") return block;
    const asset = block.data.assetId ? byId.get(block.data.assetId) : null;
    return {
      ...block,
      data: {
        ...block.data,
        url: asset?.signed_url || block.data.url || "",
      },
    };
  });
}

export function hydrateArticleBlocksFromContent(content: {
  article_blocks?: unknown;
  content?: string;
  assets?: ContentAsset[];
  cover_asset_id?: string | null;
}) {
  return withoutCoverImageBlocks(
    hydrateArticleBlocks(
      content.article_blocks,
      content.content ?? "",
      content.assets ?? [],
    ),
    content.cover_asset_id,
  );
}

export function toPublicArticleBlocks(blocks: ArticleBlock[]): PublicArticleBlock[] {
  return blocks
    .map((block) => {
      if (block.type === "text") {
        return { type: "text" as const, data: { text: block.data.text } };
      }
      if (!block.data.url) return null;
      return {
        type: "image" as const,
        data: {
          url: block.data.url,
          caption: block.data.caption ?? "",
        },
      };
    })
    .filter((block): block is PublicArticleBlock => Boolean(block));
}

export function moveArticleBlock(
  blocks: ArticleBlock[],
  blockId: string,
  direction: -1 | 1,
) {
  const index = blocks.findIndex((block) => block.id === blockId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) return blocks;
  const next = [...blocks];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}
