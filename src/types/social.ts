import { z } from "zod";

export const socialPlatformSchema = z.enum([
  "facebook",
  "instagram",
  "threads",
  "tiktok",
]);

export const socialPublicationStatusSchema = z.enum([
  "draft",
  "queued",
  "publishing",
  "published",
  "failed",
]);

export type SocialPlatform = z.infer<typeof socialPlatformSchema>;
export type SocialPublicationStatus = z.infer<
  typeof socialPublicationStatusSchema
>;

export type SocialPublication = {
  id: string;
  user_id: string;
  brand_id?: string;
  content_item_id: string;
  platform: SocialPlatform;
  social_text: string;
  media_url: string | null;
  status: SocialPublicationStatus;
  external_post_id: string | null;
  external_url: string | null;
  error_message: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  content_title?: string;
};

export type SocialConnectionState =
  | "connected"
  | "credentials_missing"
  | "permission_missing"
  | "error";

export type SocialConnection = {
  platform: SocialPlatform;
  connected: boolean;
  label: string;
  reason: string | null;
  state: SocialConnectionState;
  adapter: "official_api";
  accountName: string | null;
  missingEnv: string[];
};

export type SocialCopySet = {
  facebook: string;
  instagram: string;
  threads: string;
  tiktok: string | null;
};

export const socialCopyRequestSchema = z.object({
  contentId: z.string().min(1).optional(),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(1000),
  content: z.string().max(100_000),
  slug: z.string().trim().max(200).optional(),
  hashtags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  seoKeywords: z.string().trim().max(400).optional(),
  hasVideo: z.boolean().optional(),
  articleUrl: z.string().url().optional(),
});

export const socialDraftsSchema = z.object({
  contentId: z.string().min(1),
  selected: z.array(socialPlatformSchema).max(4).optional().default([]),
  drafts: z.object({
    facebook: z.string().max(8000).optional(),
    instagram: z.string().max(4000).optional(),
    threads: z.string().max(2000).optional(),
    tiktok: z.string().max(4000).optional(),
  }),
  mediaUrl: z.string().max(2000).nullable().optional(),
});

export const socialPublishRequestSchema = z.object({
  platforms: z.array(socialPlatformSchema).min(1).max(4),
});
