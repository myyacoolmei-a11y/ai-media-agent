"use client";

import { LoaderCircle, RefreshCw, Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { MetaSetupGuide } from "@/components/admin/meta-setup-guide";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/brand";
import {
  SOCIAL_PLATFORMS,
  socialConnectionStateLabels,
  socialPlatformLabels,
  socialStatusLabels,
} from "@/lib/social/platforms";
import { cn } from "@/lib/utils";
import type { ContentItem } from "@/types/content";
import type {
  SocialConnection,
  SocialCopySet,
  SocialPlatform,
  SocialPublication,
} from "@/types/social";

const emptyCopy: SocialCopySet = {
  facebook: "",
  instagram: "",
  threads: "",
  tiktok: "",
};

const copyHints: Record<SocialPlatform, string> = {
  facebook: "較完整摘要＋CTA＋文章連結",
  instagram: "較短、較有吸引力＋Hashtags",
  threads: "口語、短句、觀點型",
  tiktok: "短影音標題＋說明＋Hashtags",
};

export function SocialSyncPanel({
  article,
  seoKeywords,
  hashtags,
}: {
  article: ContentItem | {
    id?: string;
    title: string;
    summary: string;
    content: string;
    slug: string;
    status: string;
    cover_image?: string | null;
    video_url?: string | null;
    content_type?: string;
  };
  seoKeywords: string;
  hashtags: string[];
}) {
  const [copy, setCopy] = useState<SocialCopySet>(emptyCopy);
  const [publications, setPublications] = useState<SocialPublication[]>([]);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [previewDemo, setPreviewDemo] = useState(false);
  const hasVideo = Boolean(article.video_url) || article.content_type === "video";
  const sitePublished = article.status === "published";

  useEffect(() => {
    void fetch("/api/preview-login")
      .then((response) => response.json())
      .then((payload: { enabled?: boolean }) => {
        setPreviewDemo(Boolean(payload.enabled));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    void fetch("/api/social/status")
      .then((response) => response.json())
      .then((payload: { connections?: SocialConnection[] }) => {
        setConnections(payload.connections ?? []);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!article.id) return;
    void fetch(`/api/contents/${article.id}/social`)
      .then((response) => response.json())
      .then((payload: { publications?: SocialPublication[] }) => {
        const rows = payload.publications ?? [];
        setPublications(rows);
        setCopy({
          facebook: rows.find((row) => row.platform === "facebook")?.social_text ?? "",
          instagram: rows.find((row) => row.platform === "instagram")?.social_text ?? "",
          threads: rows.find((row) => row.platform === "threads")?.social_text ?? "",
          tiktok: rows.find((row) => row.platform === "tiktok")?.social_text ?? "",
        });
      })
      .catch(() => undefined);
  }, [article.id]);

  const connectionByPlatform = useMemo(
    () => Object.fromEntries(connections.map((item) => [item.platform, item])),
    [connections],
  );

  function mediaUrlFor(platform: SocialPlatform) {
    if (platform === "tiktok") return article.video_url || article.cover_image || null;
    return article.cover_image || article.video_url || null;
  }

  async function generateCopy() {
    setBusy("copy");
    setError("");
    try {
      const response = await fetch("/api/social/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: article.id,
          title: article.title,
          summary: article.summary,
          content: article.content,
          slug: article.slug,
          hashtags,
          seoKeywords,
          hasVideo,
        }),
      });
      const body = (await response.json()) as { copy?: SocialCopySet; error?: string };
      if (!response.ok || !body.copy) {
        throw new Error(body.error || "無法產生社群文案。");
      }
      const next = {
        facebook: body.copy.facebook,
        instagram: body.copy.instagram,
        threads: body.copy.threads,
        tiktok: body.copy.tiktok ?? "",
      };
      setCopy(next);
      if (article.id && !previewDemo) {
        await fetch(`/api/contents/${article.id}/social`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            drafts: next,
            mediaUrl: article.cover_image ?? null,
          }),
        });
        await reload();
      }
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "無法產生社群文案。");
    } finally {
      setBusy("");
    }
  }

  async function reload() {
    if (!article.id) return;
    const response = await fetch(`/api/contents/${article.id}/social`);
    const body = (await response.json()) as { publications?: SocialPublication[] };
    setPublications(body.publications ?? []);
  }

  async function persistPlatform(platform: SocialPlatform) {
    if (!article.id || previewDemo) return;
    await fetch(`/api/contents/${article.id}/social`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drafts: { [platform]: copy[platform] ?? "" },
        mediaUrl: mediaUrlFor(platform),
      }),
    });
  }

  async function publishPlatform(platform: SocialPlatform) {
    if (platform === "threads" || platform === "tiktok") {
      setError("Threads / TikTok 這階段尚未啟用。");
      return;
    }
    if (previewDemo) {
      setError("Preview 不會寫入 production social_publications。請在 production 後台操作真實報導。");
      return;
    }
    if (!article.id) {
      setError("請先儲存報導，再同步社群。");
      return;
    }
    if (!sitePublished) {
      setError("請先發布 NEWS風曝，再同步社群。網站狀態不會因社群失敗而回滾。");
      return;
    }
    setBusy(`publish-${platform}`);
    setError("");
    try {
      await persistPlatform(platform);
      const response = await fetch(`/api/contents/${article.id}/social/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: [platform],
          drafts: { [platform]: copy[platform] ?? "" },
          mediaUrl: mediaUrlFor(platform),
        }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || "社群同步失敗。");
      await reload();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "社群同步失敗。");
      await reload();
    } finally {
      setBusy("");
    }
  }

  async function retry(id: string) {
    setBusy(`retry-${id}`);
    setError("");
    try {
      const response = await fetch(`/api/social/publications/${id}/publish`, {
        method: "POST",
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || "重新發布失敗。");
      await reload();
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "重新發布失敗。");
      await reload();
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#d3b176]">
            Social
          </p>
          <h2 className="mt-2 text-lg font-medium">同步發布</h2>
          <p className="mt-2 max-w-xl text-xs leading-6 text-zinc-500">
            {SITE_NAME} 與各社群平台分開處理。單一平台失敗不會回滾網站文章。
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={Boolean(busy) || !article.title.trim()}
          onClick={() => void generateCopy()}
        >
          {busy === "copy" ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          AI 產生社群文案
        </Button>
      </div>

        {previewDemo ? (
          <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-xs leading-6 text-amber-100">
            Preview 不會寫入 production 的 social_publications。請在
            https://ai-media-agent-production.up.railway.app/admin 操作真實報導。
          </p>
        ) : null}

      <div className="mt-5 rounded-2xl border border-[#d3b176]/20 bg-[#d3b176]/[0.06] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-white">{SITE_NAME}</p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px]",
              sitePublished
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-white/5 text-zinc-500",
            )}
          >
            {sitePublished ? "已發布" : "尚未發布"}
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-zinc-500">
          請先發布網站文章，再按各平台的發布按鈕。不會因為網站發布就自動發到社群。
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {SOCIAL_PLATFORMS.map((platform) => {
          const connection = connectionByPlatform[platform];
          const publication = publications.find((row) => row.platform === platform);
          const live = platform === "facebook" || platform === "instagram";
          const disabledTikTok = platform === "tiktok" && !hasVideo;
          const connectionState = !live
            ? "credentials_missing"
            : disabledTikTok
              ? "permission_missing"
              : connection?.state ?? "credentials_missing";
          const connectionLabel = !live
            ? "尚未連線"
            : disabledTikTok
              ? "沒有影片，尚未啟用"
              : connection
                ? socialConnectionStateLabels[connection.state]
                : "尚未連線";
          return (
            <article
              key={platform}
              className={cn(
                "rounded-2xl border border-white/10 p-4",
                disabledTikTok && "opacity-70",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm text-white">
                    {socialPlatformLabels[platform]}
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {copyHints[platform]}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-500">
                    {live ? "已串官方 API" : "本階段未啟用"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px]",
                      connectionState === "connected"
                        ? "bg-emerald-400/10 text-emerald-300"
                        : connectionState === "error"
                          ? "bg-red-400/10 text-red-200"
                          : connectionState === "permission_missing"
                            ? "bg-amber-400/10 text-amber-200"
                            : "bg-white/5 text-zinc-500",
                    )}
                  >
                    {connectionLabel}
                  </span>
                  {publication ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px]",
                        publication.status === "published"
                          ? "bg-emerald-400/10 text-emerald-300"
                          : publication.status === "failed"
                            ? "bg-red-400/10 text-red-200"
                            : "bg-white/5 text-zinc-500",
                      )}
                    >
                      {socialStatusLabels[publication.status]}
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-500">
                      尚未發布
                    </span>
                  )}
                </div>
              </div>

              {connection?.accountName ? (
                <p className="mt-2 text-[11px] text-zinc-400">
                  帳號：{connection.accountName}
                </p>
              ) : null}
              {connection?.missingEnv?.length ? (
                <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                  缺少環境變數：{connection.missingEnv.join("、")}
                </p>
              ) : connection && !connection.connected && connection.reason ? (
                <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                  {connection.reason}
                </p>
              ) : null}

              <textarea
                rows={platform === "facebook" ? 7 : 5}
                value={copy[platform] ?? ""}
                disabled={disabledTikTok}
                onChange={(event) =>
                  setCopy((current) => ({
                    ...current,
                    [platform]: event.target.value,
                  }))
                }
                onBlur={() => {
                  if (article.id && !disabledTikTok) void persistPlatform(platform);
                }}
                className="editor-input mt-3 min-h-28 resize-y text-sm leading-7"
                placeholder={`${socialPlatformLabels[platform]} 文案可手動修改`}
              />

              {publication?.external_url ? (
                <a
                  href={publication.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-[11px] text-[#d3b176]"
                >
                  外部貼文連結
                </a>
              ) : publication?.status === "published" ? (
                <p className="mt-2 text-[11px] text-zinc-500">已發布，沒有外部連結</p>
              ) : null}

              {publication?.error_message ? (
                <p className="mt-2 text-[11px] leading-5 text-red-200">
                  失敗原因：{publication.error_message}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={
                    Boolean(busy) ||
                    previewDemo ||
                    !live ||
                    disabledTikTok ||
                    !article.id ||
                    publication?.status === "publishing"
                  }
                  onClick={() => void publishPlatform(platform)}
                >
                  {busy === `publish-${platform}` ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  發布
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={
                    Boolean(busy) ||
                    previewDemo ||
                    !live ||
                    !publication ||
                    publication.status === "publishing"
                  }
                  onClick={() => void retry(publication!.id)}
                >
                  {busy === `retry-${publication?.id}` ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3.5" />
                  )}
                  重新發布
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-300/[0.07] p-3 text-xs text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        <MetaSetupGuide />
      </div>
    </section>
  );
}
