import { FacebookPublisher } from "@/lib/social/publishers/facebook";
import { InstagramPublisher } from "@/lib/social/publishers/instagram";
import { ThreadsPublisher } from "@/lib/social/publishers/threads";
import { TikTokPublisher } from "@/lib/social/publishers/tiktok";
import type { SocialPublisher } from "@/lib/social/publisher";
import type { SocialPlatform } from "@/types/social";

const publishers = {
  facebook: new FacebookPublisher(),
  instagram: new InstagramPublisher(),
  threads: new ThreadsPublisher(),
  tiktok: new TikTokPublisher(),
} satisfies Record<SocialPlatform, SocialPublisher>;

export function getSocialPublisher(platform: SocialPlatform): SocialPublisher {
  return publishers[platform];
}

export function listSocialPublishers(): SocialPublisher[] {
  return Object.values(publishers);
}
