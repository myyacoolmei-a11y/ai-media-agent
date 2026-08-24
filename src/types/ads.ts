import { z } from "zod";

export const advertiserStatusSchema = z.enum(["active", "paused", "archived"]);
export const adCampaignStatusSchema = z.enum([
  "draft",
  "scheduled",
  "active",
  "paused",
  "ended",
]);
export const adCreativeTypeSchema = z.enum(["image", "video"]);
export const adRotationModeSchema = z.enum(["priority", "random"]);
export const adEventTypeSchema = z.enum(["impression", "click"]);

export const AD_PLACEMENT_KEYS = [
  "homepage_hero",
  "homepage_feed",
  "article_top",
  "article_inline",
  "article_bottom",
  "article_sidebar",
  "video",
  "sponsor",
] as const;

export type AdPlacementKey = (typeof AD_PLACEMENT_KEYS)[number];

export const advertiserInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  logo: z.string().max(2000).nullable().optional(),
  contactName: z.string().max(80).optional().default(""),
  phone: z.string().max(40).optional().default(""),
  email: z.string().max(160).optional().default(""),
  website: z.string().max(500).nullable().optional(),
  notes: z.string().max(2000).optional().default(""),
  status: advertiserStatusSchema.optional().default("active"),
});

export const campaignInputSchema = z.object({
  advertiserId: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  startDate: z.string().min(8).max(32),
  endDate: z.string().min(8).max(32),
  status: adCampaignStatusSchema.optional().default("draft"),
  priority: z.number().int().min(0).max(1000).optional().default(0),
  targetUrl: z.string().max(2000).nullable().optional(),
  placementKeys: z.array(z.string()).max(8).optional().default([]),
  rotationMode: adRotationModeSchema.optional().default("priority"),
});

export const creativeInputSchema = z.object({
  campaignId: z.string().uuid(),
  type: adCreativeTypeSchema.optional().default("image"),
  imageUrl: z.string().max(2000).nullable().optional(),
  videoUrl: z.string().max(2000).nullable().optional(),
  storageBucket: z.string().max(80).nullable().optional(),
  storagePath: z.string().max(500).nullable().optional(),
  headline: z.string().max(120).optional().default(""),
  description: z.string().max(500).optional().default(""),
  ctaText: z.string().max(40).optional().default("了解更多"),
  targetUrl: z.string().max(2000).nullable().optional(),
});

export const adEventInputSchema = z.object({
  campaignId: z.string().uuid(),
  creativeId: z.string().uuid().nullable().optional(),
  placementKey: z.string().min(1).max(40),
  articleId: z.string().uuid().nullable().optional(),
  eventType: adEventTypeSchema,
});

export type Advertiser = {
  id: string;
  name: string;
  logo: string | null;
  contact_name: string;
  phone: string;
  email: string;
  website: string | null;
  notes: string;
  status: z.infer<typeof advertiserStatusSchema>;
  created_at: string;
};

export type AdCampaign = {
  id: string;
  advertiser_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: z.infer<typeof adCampaignStatusSchema>;
  priority: number;
  target_url: string | null;
  created_at: string;
};

export type AdCreative = {
  id: string;
  campaign_id: string;
  type: z.infer<typeof adCreativeTypeSchema>;
  image_url: string | null;
  video_url: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  headline: string;
  description: string;
  cta_text: string;
  target_url: string | null;
  created_at: string;
};

export type AdPlacement = {
  id: string;
  code: string;
  key: AdPlacementKey | string;
  name: string;
  description: string;
  width: number | null;
  height: number | null;
};

export type ServedAd = {
  campaignId: string;
  campaignName: string;
  creativeId: string | null;
  placementKey: string;
  placementId: string;
  headline: string;
  description: string;
  ctaText: string;
  imageUrl: string | null;
  videoUrl: string | null;
  targetUrl: string | null;
  advertiserName: string;
  advertiserLogo: string | null;
  label: "ADVERTISEMENT" | "合作品牌";
};

export type AdStatsRow = {
  campaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  ctr: number;
};
