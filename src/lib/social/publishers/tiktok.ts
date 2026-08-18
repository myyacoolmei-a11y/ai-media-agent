import type {
  SocialPublisher,
  SocialPublisherConnection,
  SocialPublishResult,
} from "@/lib/social/publisher";

export class TikTokPublisher implements SocialPublisher {
  readonly platform = "tiktok" as const;

  async getConnection(): Promise<SocialPublisherConnection> {
    return { connected: false, reason: "尚未連線" };
  }

  async publish(): Promise<SocialPublishResult> {
    return { ok: false, error: "尚未連線" };
  }
}
