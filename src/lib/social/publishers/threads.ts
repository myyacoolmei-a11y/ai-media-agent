import {
  THREADS_CREDENTIAL_ENV,
  THREADS_REQUIRED_ENV,
  missingEnv,
  threadsConfig,
  threadsConfigured,
} from "@/lib/social/config";
import { isDirectVideoUrl, isPublicImageUrl } from "@/lib/social/platforms";
import type {
  SocialPublisher,
  SocialPublisherConnection,
  SocialPublishInput,
  SocialPublishResult,
} from "@/lib/social/publisher";
import { threadsRequest } from "@/lib/social/threads-client";

export class ThreadsPublisher implements SocialPublisher {
  readonly platform = "threads" as const;

  async getConnection(): Promise<SocialPublisherConnection> {
    const missing = missingEnv(THREADS_REQUIRED_ENV);
    if (missing.length || !threadsConfigured()) {
      return {
        connected: false,
        state: "credentials_missing",
        reason: "尚未設定 credentials",
        missingEnv: missingEnv(THREADS_CREDENTIAL_ENV),
      };
    }
    const { userId, accessToken } = threadsConfig();
    try {
      const account = await threadsRequest<{
        id: string;
        username?: string;
      }>(`/${userId}`, accessToken, {
        search: { fields: "id,username" },
      });
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
        reason: error instanceof Error ? error.message : "Threads 連線失敗",
        missingEnv: [],
      };
    }
  }

  async publish(input: SocialPublishInput): Promise<SocialPublishResult> {
    const connection = await this.getConnection();
    if (!connection.connected) {
      return { ok: false, error: connection.reason || "尚未連線" };
    }
    const text = input.text.trim();
    if (!text) {
      return { ok: false, error: "Threads 文案是空的。" };
    }
    const { userId, accessToken } = threadsConfig();

    try {
      const search: Record<string, string> = { text };
      if (isDirectVideoUrl(input.mediaUrl)) {
        search.media_type = "VIDEO";
        search.video_url = input.mediaUrl!;
      } else if (isPublicImageUrl(input.mediaUrl)) {
        search.media_type = "IMAGE";
        search.image_url = input.mediaUrl!;
      } else {
        search.media_type = "TEXT";
      }

      const container = await threadsRequest<{ id?: string }>(
        `/${userId}/threads`,
        accessToken,
        { method: "POST", search },
      );
      if (!container.id) {
        return { ok: false, error: "Threads 無法建立貼文容器。" };
      }
      if (search.media_type === "VIDEO") {
        await waitUntilReady(container.id, accessToken);
      }
      const published = await threadsRequest<{ id?: string }>(
        `/${userId}/threads_publish`,
        accessToken,
        { method: "POST", search: { creation_id: container.id } },
      );
      const id = published.id ?? container.id;
      let permalink: string | null = null;
      if (id) {
        try {
          const media = await threadsRequest<{ permalink?: string }>(
            `/${id}`,
            accessToken,
            { search: { fields: "permalink" } },
          );
          permalink = media.permalink ?? null;
        } catch {
          permalink = null;
        }
      }
      return {
        ok: true,
        externalPostId: id ?? null,
        externalUrl: permalink,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Threads 發布失敗",
      };
    }
  }
}

async function waitUntilReady(creationId: string, token: string) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const status = await threadsRequest<{
      status?: string;
      error_message?: string;
    }>(`/${creationId}`, token, {
      search: { fields: "status,error_message" },
    });
    if (status.status === "FINISHED") return;
    if (status.status === "ERROR") {
      throw new Error(status.error_message || "Threads 影片處理失敗。");
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  throw new Error("Threads 影片處理逾時。");
}
