"use client";

import { LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/brand";
import {
  SOCIAL_PLATFORMS,
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

export function SocialSyncPanel({
  article,
  seoKeywords,
  hashtags,
}: {
  article: ContentItem | { id?: string; title: string; summary: string; content: string; slug: string; status: string; cover_image?: string | null; video_url?: string | null; content_type?: string };
  seoKeywords: string;
  hashtags: string[];
}) {
  const [selected, setSelected] = useState<SocialPlatform[]>([]);
  const [copy, setCopy] = useState<SocialCopySet>(emptyCopy);
  const [publications, setPublications] = useState<SocialPublication[]>([]);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const hasVideo = Boolean(article.video_url) || article.content_type === "video";

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

  function toggle(platform: SocialPlatform) {
    if (platform === "tiktok" && !hasVideo) return;
    setSelected((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform],
    );
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
      setCopy({
        facebook: body.copy.facebook,
        instagram: body.copy.instagram,
        threads: body.copy.threads,
        tiktok: body.copy.tiktok ?? "",
      });
      if (article.id) {
        await fetch(`/api/contents/${article.id}/social`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selected,
            drafts: body.copy,
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

  async function persistDrafts() {
    if (!article.id) return;
    await fetch(`/api/contents/${article.id}/social`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selected,
        drafts: copy,
        mediaUrl: article.cover_image ?? null,
      }),
    });
  }

  async function publishSelected() {
    if (!article.id) {
      setError("請先儲存報導，再同步社群。");
      return;
    }
    if (!selected.length) {
      setError("請先勾選要同步的社群平台。");
      return;
    }
    setBusy("publish");
    setError("");
    try {
      await persistDrafts();
      const response = await fetch(`/api/contents/${article.id}/social/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: selected,
          drafts: copy,
          mediaUrl: article.cover_image ?? null,
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
          <h2 className="mt-2 text-lg font-medium">社群同步</h2>
          <p className="mt-2 max-w-xl text-xs leading-6 text-zinc-500">
            預設只發布 {SITE_NAME}。社群平台要另外勾選，網站發布成功或失敗都不會和社群綁在一起。
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
          AI 產生各平台文案
        </Button>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex items-start gap-3 rounded-2xl border border-[#d3b176]/20 bg-[#d3b176]/[0.06] p-3">
          <input type="checkbox" checked readOnly className="mt-1" />
          <span>
            <span className="block text-sm text-white">{SITE_NAME}</span>
            <span className="mt-1 block text-[11px] text-zinc-500">
              {article.status === "published" ? "已發布" : "將發布到網站"}
            </span>
          </span>
        </label>
        {SOCIAL_PLATFORMS.map((platform) => {
          const connection = connectionByPlatform[platform];
          const publication = publications.find((row) => row.platform === platform);
          const disabled = platform === "tiktok" && !hasVideo;
          return (
            <label
              key={platform}
              className={cn(
                "flex items-start gap-3 rounded-2xl border border-white/10 p-3",
                disabled && "opacity-50",
              )}
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={selected.includes(platform)}
                disabled={disabled}
                onChange={() => toggle(platform)}
              />
              <span className="min-w-0">
                <span className="block text-sm text-white">
                  {socialPlatformLabels[platform]}
                </span>
                <span className="mt-1 block text-[11px] text-zinc-500">
                  {disabled
                    ? "沒有影片，尚未啟用"
                    : publication
                      ? socialStatusLabels[publication.status]
                      : selected.includes(platform)
                        ? "已選擇，尚未發布"
                        : connection?.connected
                          ? "未選擇"
                          : connection?.reason || "尚未連線"}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-5 space-y-4">
        {SOCIAL_PLATFORMS.map((platform) => {
          if (platform === "tiktok" && !hasVideo && !copy.tiktok) return null;
          const publication = publications.find((row) => row.platform === platform);
          const connection = connectionByPlatform[platform];
          return (
            <label key={platform} className="block">
              <span className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                {socialPlatformLabels[platform]}文案
                {connection && !connection.connected ? (
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-500">
                    尚未連線
                  </span>
                ) : null}
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
                ) : null}
              </span>
              <textarea
                rows={platform === "facebook" ? 7 : 5}
                value={copy[platform] ?? ""}
                onChange={(event) =>
                  setCopy((current) => ({
                    ...current,
                    [platform]: event.target.value,
                  }))
                }
                className="editor-input min-h-28 resize-y text-sm leading-7"
                placeholder={`${socialPlatformLabels[platform]} 獨立文案`}
              />
              {publication?.error_message ? (
                <span className="mt-2 flex flex-col gap-2 text-[11px] text-red-200 sm:flex-row sm:items-center sm:justify-between">
                  <span>{publication.error_message}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={Boolean(busy)}
                    onClick={() => void retry(publication.id)}
                  >
                    {busy === `retry-${publication.id}` ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    重新發布
                  </Button>
                </span>
              ) : publication?.external_url ? (
                <a
                  href={publication.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-[11px] text-[#d3b176]"
                >
                  查看外部貼文
                </a>
              ) : null}
            </label>
          );
        })}
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-300/[0.07] p-3 text-xs text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          disabled={Boolean(busy) || !selected.length}
          onClick={() => void publishSelected()}
        >
          {busy === "publish" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : null}
          同步發布已選社群
        </Button>
        <p className="text-[11px] leading-6 text-zinc-600 sm:self-center">
          不會因為按下網站「發布」就自動發到社群。
        </p>
      </div>
    </section>
  );
}
