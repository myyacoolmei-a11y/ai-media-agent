import type {
  SocialPublisher,
  SocialPublisherConnection,
  SocialPublishResult,
} from "@/lib/social/publisher";

export class TikTokPublisher implements SocialPublisher {
  readonly platform = "tiktok" as const;

  async getConnection(): Promise<SocialPublisherConnection> {
    return {
      connected: false,
      state: "credentials_missing",
      reason: "尚未連線",
      missingEnv: [],
    };
  }

  async publish(): Promise<SocialPublishResult> {
    return { ok: false, error: "尚未連線" };
  }
}
