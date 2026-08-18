import type { SocialPlatform, SocialPublicationStatus } from "@/types/social";

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "facebook",
  "instagram",
  "threads",
  "tiktok",
];

export const socialPlatformLabels: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  threads: "Threads",
  tiktok: "TikTok",
};

export const socialStatusLabels: Record<SocialPublicationStatus, string> = {
  draft: "草稿",
  queued: "待發布",
  publishing: "發布中",
  published: "已發布",
  failed: "發布失敗",
};

export function isDirectVideoUrl(url: string | null | undefined) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) return false;
    if (/(youtube\.com|youtu\.be|vimeo\.com)/i.test(parsed.hostname)) {
      return false;
    }
    return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function isPublicImageUrl(url: string | null | undefined) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return /^https?:$/.test(parsed.protocol);
  } catch {
    return false;
  }
}
