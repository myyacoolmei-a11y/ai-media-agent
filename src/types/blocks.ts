import { z } from "zod";

export const articleBlockTypeSchema = z.enum([
  "text",
  "heading",
  "quote",
  "image",
  "gallery",
  "video",
  "embed",
  "ad",
  "related_articles",
]);

export type ArticleBlockType = z.infer<typeof articleBlockTypeSchema>;

export const galleryLayoutSchema = z.enum([
  "single",
  "two",
  "three",
  "gallery",
  "carousel",
]);

export type GalleryLayout = z.infer<typeof galleryLayoutSchema>;

export const galleryItemSchema = z.object({
  mediaAssetId: z.string().uuid().nullable().optional(),
  url: z.string().min(1),
  storagePath: z.string().optional(),
  bucket: z.string().optional(),
  caption: z.string().max(500).optional().default(""),
  alt: z.string().max(300).optional().default(""),
  source: z.string().max(200).optional().default(""),
});

export const articleBlockSchema = z.object({
  id: z.string().uuid().optional(),
  type: articleBlockTypeSchema,
  sortOrder: z.number().int().min(0).max(10_000),
  content: z.string().max(50_000).optional().default(""),
  mediaUrl: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  caption: z.string().max(500).optional().default(""),
  source: z.string().max(200).optional().default(""),
  altText: z.string().max(300).optional().default(""),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export const articleBlocksSaveSchema = z.object({
  blocks: z.array(articleBlockSchema).max(200),
});

export type ArticleBlock = {
  id: string;
  article_id: string;
  type: ArticleBlockType;
  sort_order: number;
  content: string;
  media_url: string | null;
  thumbnail_url: string | null;
  caption: string;
  source: string;
  alt_text: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export const articleBlockTypeLabels: Record<ArticleBlockType, string> = {
  text: "文字",
  heading: "小標題",
  quote: "引言",
  image: "圖片",
  gallery: "圖集",
  video: "影片",
  embed: "外部影片",
  ad: "廣告",
  related_articles: "延伸閱讀",
};
