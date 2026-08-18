import type { SocialConnectionState, SocialPlatform } from "@/types/social";

export type SocialPublishInput = {
  text: string;
  mediaUrl?: string | null;
  articleUrl?: string | null;
  title?: string;
  hasVideo?: boolean;
};

export type SocialPublishResult = {
  ok: boolean;
  externalPostId?: string | null;
  externalUrl?: string | null;
  error?: string;
};

export type SocialPublisherConnection = {
  connected: boolean;
  accountName?: string | null;
  reason?: string | null;
  state: SocialConnectionState;
  missingEnv?: string[];
};

export interface SocialPublisher {
  readonly platform: SocialPlatform;
  getConnection(): Promise<SocialPublisherConnection>;
  publish(input: SocialPublishInput): Promise<SocialPublishResult>;
}
