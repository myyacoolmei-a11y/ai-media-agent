import {
  INSTAGRAM_CREDENTIAL_ENV,
  INSTAGRAM_REQUIRED_ENV,
  instagramConfigured,
  instagramConfig,
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

export class InstagramPublisher implements SocialPublisher {
  readonly platform = "instagram" as const;

  async getConnection(): Promise<SocialPublisherConnection> {
    const missingRequired = missingEnv(INSTAGRAM_REQUIRED_ENV);
    if (missingRequired.length || !instagramConfigured()) {
      return {
        connected: false,
        state: "credentials_missing",
        reason: "尚未設定 credentials",
        missingEnv: missingEnv(INSTAGRAM_CREDENTIAL_ENV),
      };
    }
    const { pageAccessToken, igUserId } = instagramConfig();
    try {
      const account = await metaRequest<{ id: string; username?: string }>(
        `/${igUserId}`,
        pageAccessToken,
        { search: { fields: "id,username" } },
      );
      return {
        connected: true,
        state: "connected",
        accountName: account.username ?? account.id,
        reason: null,
        missingEnv: [],
      };
    } catch (error) {
      return {
        connected: false,
        state: "error",
        reason:
          error instanceof Error ? error.message : "Instagram 連線失敗",
        missingEnv: [],
      };
    }
  }

  async publish(input: SocialPublishInput): Promise<SocialPublishResult> {
    const connection = await this.getConnection();
    if (!connection.connected) {
      return { ok: false, error: connection.reason || "尚未連線" };
    }
    const caption = input.text.trim();
    if (!caption) {
      return { ok: false, error: "Instagram 文案是空的。" };
    }
    const { pageAccessToken, igUserId } = instagramConfig();
    if (!igUserId || !pageAccessToken) {
      return { ok: false, error: "尚未設定 credentials" };
    }

    try {
      const search: Record<string, string> = { caption };
      if (isDirectVideoUrl(input.mediaUrl)) {
        search.media_type = "REELS";
        search.video_url = input.mediaUrl!;
      } else if (isPublicImageUrl(input.mediaUrl)) {
        search.image_url = input.mediaUrl!;
      } else {
        return {
          ok: false,
          error: "Instagram 需要可公開存取的封面圖片或影片網址。",
        };
      }

      const container = await metaRequest<{ id?: string }>(
        `/${igUserId}/media`,
        pageAccessToken,
        {
          method: "POST",
          search,
        },
      );
      if (!container.id) {
        return { ok: false, error: "Instagram 無法建立媒體容器。" };
      }
      if (search.media_type === "REELS") {
        await waitUntilReady(container.id, pageAccessToken);
      }
      const published = await metaRequest<{ id?: string }>(
        `/${igUserId}/media_publish`,
        pageAccessToken,
        { method: "POST", search: { creation_id: container.id } },
      );
      const mediaId = published.id ?? container.id;
      let permalink: string | null = mediaId
        ? `https://www.instagram.com/p/${mediaId}/`
        : null;
      if (mediaId) {
        try {
          const media = await metaRequest<{ permalink?: string }>(
            `/${mediaId}`,
            pageAccessToken,
            { search: { fields: "permalink" } },
          );
          if (media.permalink) permalink = media.permalink;
        } catch {
          // Keep the constructed URL if permalink lookup fails.
        }
      }
      return {
        ok: true,
        externalPostId: mediaId,
        externalUrl: permalink,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Instagram 發布失敗",
      };
    }
  }
}

async function waitUntilReady(creationId: string, token: string) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const status = await metaRequest<{
      status_code?: string;
      status?: string;
    }>(`/${creationId}`, token, {
      search: { fields: "status_code,status" },
    });
    if (status.status_code === "FINISHED" || status.status === "FINISHED") {
      return;
    }
    if (status.status_code === "ERROR") {
      throw new Error("Instagram 影片處理失敗。");
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  throw new Error("Instagram 影片處理逾時。");
}
