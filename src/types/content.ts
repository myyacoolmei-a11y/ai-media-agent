import { z } from "zod";

export const contentTypeSchema = z.enum([
  "article",
  "video",
  "short_video",
  "image",
  "audio_report",
  "interview",
]);

export const contentStatusSchema = z.enum([
  "draft",
  "preview",
  "published",
  "archived",
]);

export const contentInputSchema = z.object({
  title: z.string().trim().max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug 格式不正確"),
  summary: z.string().trim().max(1000),
  content: z.string().max(100_000),
  videoUrl: z.union([z.string().url(), z.literal("")]),
  category: z.string().trim().min(1).max(100),
  contentType: contentTypeSchema,
  styleProfileId: z.string().uuid().nullable(),
});

export const contentAssetRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive().max(1024 * 1024 * 1024),
  assetType: z.enum(["image", "video", "audio"]),
});

export type ContentType = z.infer<typeof contentTypeSchema>;
export type ContentStatus = z.infer<typeof contentStatusSchema>;
export type ContentInput = z.infer<typeof contentInputSchema>;

export type ContentAsset = {
  id: string;
  content_item_id: string;
  asset_type: "image" | "video" | "audio";
  status: "pending" | "ready" | "failed";
  bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  alt_text: string;
  sort_order: number;
  signed_url?: string;
};

export type ContentItem = {
  id: string;
  user_id: string;
  project_id: string | null;
  style_profile_id: string | null;
  title: string;
  slug: string;
  summary: string;
  content: string;
  video_url: string | null;
  category: string;
  content_type: ContentType;
  status: ContentStatus;
  cover_asset_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  assets?: ContentAsset[];
  cover_image?: string | null;
};

export type PublicContentItem = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  videoUrl: string | null;
  coverImage: string | null;
  category: string;
  contentType: ContentType;
  status: "published";
  publishedAt: string;
  media: Array<{
    type: "image" | "video" | "audio";
    url: string;
    alt: string;
  }>;
};

export const contentTypeLabels: Record<ContentType, string> = {
  article: "文章",
  video: "影片",
  short_video: "短影音",
  image: "圖文",
  audio_report: "影音報導",
  interview: "人物專訪",
};

export const contentStatusLabels: Record<ContentStatus, string> = {
  draft: "草稿",
  preview: "預覽中",
  published: "已發布",
  archived: "已封存",
};
