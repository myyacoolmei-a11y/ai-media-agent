import {
  FACEBOOK_CREDENTIAL_ENV,
  FACEBOOK_REQUIRED_ENV,
  facebookConfigured,
  facebookConfig,
  missingEnv,
} from "@/lib/social/config";
import { metaRequest } from "@/lib/social/meta-client";
import { isDirectVideoUrl, isPublicImageUrl } from "@/lib/social/platforms";
import type {
  SocialPublisher,
  SocialPublisherConnection,
  SocialPublishInput,
  SocialPublishResult,
} from "@/lib/social/publisher";

export class FacebookPublisher implements SocialPublisher {
  readonly platform = "facebook" as const;

  async getConnection(): Promise<SocialPublisherConnection> {
    const missingRequired = missingEnv(FACEBOOK_REQUIRED_ENV);
    if (missingRequired.length) {
      return {
        connected: false,
        state: "credentials_missing",
        reason: "尚未設定 credentials",
        missingEnv: missingEnv(FACEBOOK_CREDENTIAL_ENV),
      };
    }
    const { pageId, pageAccessToken } = facebookConfig();
    try {
      const page = await metaRequest<{ id: string; name?: string }>(
        `/${pageId}`,
        pageAccessToken,
        { search: { fields: "id,name" } },
      );
      return {
        connected: true,
        state: "connected",
        accountName: page.name ?? page.id,
        reason: null,
        missingEnv: [],
      };
    } catch (error) {
      return {
        connected: false,
        state: "error",
        reason:
          error instanceof Error ? error.message : "Facebook Page 連線失敗",
        missingEnv: [],
      };
    }
  }

  async publish(input: SocialPublishInput): Promise<SocialPublishResult> {
    const connection = await this.getConnection();
    if (!connection.connected) {
      return { ok: false, error: connection.reason || "尚未連線" };
    }
    if (!facebookConfigured()) {
      return { ok: false, error: "尚未設定 credentials" };
    }
    const { pageId, pageAccessToken } = facebookConfig();
    const message = input.text.trim();
    if (!message) {
      return { ok: false, error: "Facebook 文案是空的。" };
    }

    try {
      if (isDirectVideoUrl(input.mediaUrl)) {
        const posted = await metaRequest<{ id?: string }>(
          `/${pageId}/videos`,
          pageAccessToken,
          {
            method: "POST",
            search: {
              file_url: input.mediaUrl!,
              description: message,
            },
          },
        );
        const id = posted.id ?? null;
        return {
          ok: true,
          externalPostId: id,
          externalUrl: id ? `https://www.facebook.com/${id}` : null,
        };
      }

      if (isPublicImageUrl(input.mediaUrl) && !input.hasVideo) {
        const posted = await metaRequest<{ post_id?: string; id?: string }>(
          `/${pageId}/photos`,
          pageAccessToken,
          {
            method: "POST",
            search: {
              url: input.mediaUrl!,
              message,
            },
          },
        );
        const id = posted.post_id ?? posted.id ?? null;
        return {
          ok: true,
          externalPostId: id,
          externalUrl: id ? `https://www.facebook.com/${id}` : null,
        };
      }

      const search: Record<string, string> = { message };
      if (input.articleUrl) search.link = input.articleUrl;
      const posted = await metaRequest<{ id?: string }>(
        `/${pageId}/feed`,
        pageAccessToken,
        { method: "POST", search },
      );
      return {
        ok: true,
        externalPostId: posted.id ?? null,
        externalUrl: posted.id
          ? `https://www.facebook.com/${posted.id}`
          : null,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Facebook 發布失敗",
      };
    }
  }
}
