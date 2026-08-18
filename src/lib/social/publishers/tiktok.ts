import {
  TIKTOK_REQUIRED_ENV,
  missingEnv,
  tiktokConfig,
  tiktokCredentialsPresent,
  tiktokPostingEnabled,
} from "@/lib/social/config";
import { isDirectVideoUrl } from "@/lib/social/platforms";
import type {
  SocialPublisher,
  SocialPublisherConnection,
  SocialPublishInput,
  SocialPublishResult,
} from "@/lib/social/publisher";

type TikTokErrorBody = {
  error?: { code?: string; message?: string };
  data?: {
    publish_id?: string;
    display_name?: string;
    user?: { display_name?: string };
  };
};

export class TikTokPublisher implements SocialPublisher {
  readonly platform = "tiktok" as const;

  async getConnection(): Promise<SocialPublisherConnection> {
    const missing = missingEnv(TIKTOK_REQUIRED_ENV);
    if (missing.length || !tiktokCredentialsPresent()) {
      return {
        connected: false,
        state: "credentials_missing",
        reason: "尚未設定 credentials",
        missingEnv: missing,
      };
    }
    if (!tiktokPostingEnabled()) {
      return {
        connected: false,
        state: "permission_missing",
        reason:
          "尚未取得平台權限。需 TikTok Content Posting API，並在 Railway 設定 TIKTOK_CONTENT_POSTING_ENABLED=true",
        missingEnv: [],
      };
    }

    const { accessToken } = tiktokConfig();
    try {
      const url = new URL("https://open.tiktokapis.com/v2/user/info/");
      url.searchParams.set("fields", "open_id,display_name");
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const body = (await response.json()) as TikTokErrorBody;
      if (!response.ok || (body.error && body.error.code && body.error.code !== "ok")) {
        return {
          connected: false,
          state: "error",
          reason: body.error?.message || `TikTok API ${response.status}`,
          missingEnv: [],
        };
      }
      return {
        connected: true,
        state: "connected",
        accountName:
          body.data?.user?.display_name ?? body.data?.display_name ?? null,
        reason: null,
        missingEnv: [],
      };
    } catch (error) {
      return {
        connected: false,
        state: "error",
        reason: error instanceof Error ? error.message : "TikTok 連線失敗",
        missingEnv: [],
      };
    }
  }

  async publish(input: SocialPublishInput): Promise<SocialPublishResult> {
    if (!input.hasVideo && !isDirectVideoUrl(input.mediaUrl)) {
      return { ok: false, error: "TikTok 只接受有影片的報導。" };
    }
    const connection = await this.getConnection();
    if (!connection.connected) {
      return { ok: false, error: connection.reason || "尚未連線" };
    }
    const text = input.text.trim();
    if (!text) {
      return { ok: false, error: "TikTok 文案是空的。" };
    }
    const videoUrl = isDirectVideoUrl(input.mediaUrl) ? input.mediaUrl : null;
    if (!videoUrl) {
      return { ok: false, error: "TikTok 需要可公開存取的影片網址。" };
    }

    const { accessToken, privacyLevel } = tiktokConfig();
    try {
      const response = await fetch(
        "https://open.tiktokapis.com/v2/post/publish/video/init/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json; charset=UTF-8",
          },
          body: JSON.stringify({
            post_info: {
              title: (input.title || text).slice(0, 150),
              description: text.slice(0, 4000),
              privacy_level: privacyLevel,
              disable_duet: false,
              disable_comment: false,
              disable_stitch: false,
            },
            source_info: {
              source: "PULL_FROM_URL",
              video_url: videoUrl,
            },
          }),
          cache: "no-store",
        },
      );
      const body = (await response.json()) as TikTokErrorBody;
      const errorCode = body.error?.code;
      if (
        !response.ok ||
        (errorCode && errorCode !== "ok") ||
        !body.data?.publish_id
      ) {
        return {
          ok: false,
          error:
            body.error?.message ||
            (errorCode && errorCode !== "ok"
              ? `TikTok 尚未取得平台權限（${errorCode}）`
              : "TikTok 發布失敗"),
        };
      }
      return {
        ok: true,
        externalPostId: body.data.publish_id,
        externalUrl: null,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "TikTok 發布失敗",
      };
    }
  }
}
