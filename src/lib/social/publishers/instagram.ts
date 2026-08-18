import {
  instagramConfigured,
  instagramConfig,
} from "@/lib/social/config";
import { metaRequest } from "@/lib/social/meta-client";
import { isDirectVideoUrl, isPublicImageUrl } from "@/lib/social/platforms";
import type {
  SocialPublisher,
  SocialPublisherConnection,
  SocialPublishInput,
  SocialPublishResult,
} from "@/lib/social/publisher";

async function resolveIgUserId(pageId: string, token: string, explicit?: string) {
  if (explicit) return explicit;
  const page = await metaRequest<{
    instagram_business_account?: { id?: string };
  }>(`/${pageId}`, token, {
    search: { fields: "instagram_business_account" },
  });
  const id = page.instagram_business_account?.id;
  if (!id) {
    throw new Error("這個 Facebook Page 尚未連結 Instagram 專業帳號。");
  }
  return id;
}

export class InstagramPublisher implements SocialPublisher {
  readonly platform = "instagram" as const;

  async getConnection(): Promise<SocialPublisherConnection> {
    if (!instagramConfigured()) {
      return { connected: false, reason: "尚未連線" };
    }
    const { pageId, pageAccessToken, igUserId } = instagramConfig();
    try {
      const id = await resolveIgUserId(pageId, pageAccessToken, igUserId);
      const account = await metaRequest<{ id: string; username?: string }>(
        `/${id}`,
        pageAccessToken,
        { search: { fields: "id,username" } },
      );
      return {
        connected: true,
        accountName: account.username ?? account.id,
        reason: null,
      };
    } catch (error) {
      return {
        connected: false,
        reason:
          error instanceof Error ? error.message : "Instagram 連線失敗",
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
    const { pageId, pageAccessToken, igUserId } = instagramConfig();

    try {
      const id = await resolveIgUserId(pageId, pageAccessToken, igUserId);
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

      const container = await metaRequest<{ id?: string }>(`/${id}/media`, pageAccessToken, {
        method: "POST",
        search,
      });
      if (!container.id) {
        return { ok: false, error: "Instagram 無法建立媒體容器。" };
      }
      if (search.media_type === "REELS") {
        await waitUntilReady(container.id, pageAccessToken);
      }
      const published = await metaRequest<{ id?: string }>(
        `/${id}/media_publish`,
        pageAccessToken,
        { method: "POST", search: { creation_id: container.id } },
      );
      return {
        ok: true,
        externalPostId: published.id ?? container.id,
        externalUrl: published.id
          ? `https://www.instagram.com/p/${published.id}/`
          : null,
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
  for (let attempt = 0; attempt < 8; attempt += 1) {
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
}
