"use client";

import {
  ArrowLeft,
  Check,
  ImagePlus,
  LoaderCircle,
  Save,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ContentAiTools } from "@/components/content-ai-tools";
import { createClient } from "@/lib/supabase/client";
import type { ContentItem } from "@/types/content";
import type { BrandStyleProfile } from "@/types/style";

export function ArticleEditor({
  initialContent,
  styles,
}: {
  initialContent: ContentItem;
  styles: BrandStyleProfile[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [article, setArticle] = useState(initialContent);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save(nextArticle = article) {
    setBusy("save");
    setError("");
    const response = await fetch(`/api/contents/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: nextArticle.title,
        slug: nextArticle.slug,
        summary: nextArticle.summary,
        content: nextArticle.content,
        videoUrl: nextArticle.video_url ?? "",
        socialCopy: {
          facebook: nextArticle.social_copy?.facebook ?? "",
          instagram: nextArticle.social_copy?.instagram ?? "",
          threads: nextArticle.social_copy?.threads ?? "",
        },
        category: "未分類",
        contentType: "article",
        styleProfileId: nextArticle.style_profile_id,
        coverAssetId: nextArticle.cover_asset_id,
      }),
    });
    const payload = (await response.json()) as {
      content?: ContentItem;
      error?: string;
    };
    setBusy("");
    if (!response.ok || !payload.content) {
      setError(payload.error || "儲存失敗。");
      return false;
    }
    setArticle((current) => ({ ...current, ...payload.content }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
    return true;
  }

  async function publish() {
    const didSave = await save();
    if (!didSave) return;
    setBusy("publish");
    const response = await fetch(`/api/contents/${article.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });
    const payload = (await response.json()) as {
      content?: ContentItem;
      error?: string;
    };
    setBusy("");
    if (!response.ok || !payload.content) {
      setError(payload.error || "發布失敗。");
      return;
    }
    setArticle((current) => ({ ...current, ...payload.content }));
    router.refresh();
  }

  async function unpublish() {
    const response = await fetch(`/api/contents/${article.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "draft" }),
    });
    const payload = (await response.json()) as { content?: ContentItem };
    if (payload.content) {
      setArticle((current) => ({ ...current, ...payload.content }));
      router.refresh();
    }
  }

  async function uploadCover(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("封面必須是圖片檔案。");
      return;
    }
    setBusy("cover");
    setError("");
    try {
      const prepareResponse = await fetch(
        `/api/contents/${article.id}/assets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            assetType: "image",
          }),
        },
      );
      const prepared = (await prepareResponse.json()) as {
        asset?: { id: string };
        upload?: { path: string; token: string };
        error?: string;
      };
      if (!prepareResponse.ok || !prepared.asset || !prepared.upload) {
        throw new Error(prepared.error || "無法準備封面上傳。");
      }
      const { error: uploadError } = await createClient().storage
        .from("content-media")
        .uploadToSignedUrl(
          prepared.upload.path,
          prepared.upload.token,
          file,
          { contentType: file.type },
        );
      if (uploadError) throw uploadError;
      const complete = await fetch(
        `/api/contents/${article.id}/assets/${prepared.asset.id}/complete`,
        { method: "POST" },
      );
      if (!complete.ok) throw new Error("封面驗證失敗。");

      const refreshed = await fetch(`/api/contents/${article.id}`, {
        cache: "no-store",
      });
      const data = (await refreshed.json()) as { content?: ContentItem };
      const uploadedAsset = data.content?.assets?.find(
        (asset) => asset.id === prepared.asset?.id,
      );
      if (!data.content || !uploadedAsset) {
        throw new Error("無法讀取已上傳封面。");
      }
      const nextArticle = {
        ...data.content,
        cover_asset_id: uploadedAsset.id,
        cover_image: uploadedAsset.signed_url ?? null,
      };
      setArticle(nextArticle);
      await save(nextArticle);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "封面上傳失敗。",
      );
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="grid size-9 place-items-center rounded-full border border-white/[0.08] text-zinc-600 hover:text-white"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <p className="text-[10px] text-zinc-600">
              {article.status === "published" ? "已發布" : "草稿"}
            </p>
            <h1 className="mt-1 text-lg font-medium">
              {article.title || "未命名文章"}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={Boolean(busy)}
            onClick={() => save()}
          >
            {busy === "save" ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : saved ? (
              <Check className="size-3.5" />
            ) : (
              <Save className="size-3.5" />
            )}
            {saved ? "已儲存" : "儲存草稿"}
          </Button>
          {article.status === "published" ? (
            <Button size="sm" variant="secondary" onClick={unpublish}>
              取消發布
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={Boolean(busy)}
              onClick={publish}
            >
              {busy === "publish" ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              發布
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-5 rounded-xl bg-red-300/[0.07] p-3 text-xs text-red-200">
          {error}
        </p>
      )}

      <div className="mt-7 space-y-6">
        <label className="block">
          <span className="mb-2 block text-xs text-zinc-400">標題</span>
          <input
            value={article.title}
            onChange={(event) =>
              setArticle((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            className="editor-input text-xl font-medium"
          />
        </label>

        <ContentAiTools
          contentId={article.id}
          sourceText={article.content || article.summary || article.title}
          onApply={(result, action) =>
            setArticle((current) => ({
              ...current,
              title:
                action === "title" || action === "article"
                  ? result.title || current.title
                  : current.title,
              summary:
                action === "summary" || action === "article"
                  ? result.summary || current.summary
                  : current.summary,
              content:
                action === "organize" ||
                action === "rewrite" ||
                action === "article"
                  ? result.content || current.content
                  : current.content,
              social_copy:
                action === "social" ? result.socialCopy : current.social_copy,
            }))
          }
        />

        <label className="block rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
          <span className="text-xs text-zinc-400">套用品牌風格</span>
          <select
            value={article.style_profile_id ?? ""}
            onChange={(event) =>
              setArticle((current) => ({
                ...current,
                style_profile_id: event.target.value || null,
              }))
            }
            className="setting-input mt-3"
          >
            <option value="">不指定</option>
            {styles.map((style) => (
              <option key={style.id} value={style.id}>
                {style.style_name}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-[11px] text-zinc-700">
            主動使用 AI 文字工具時，會自動套用這套風格。
          </span>
        </label>

        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
          <p className="text-xs text-zinc-400">社群文案</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(["facebook", "instagram", "threads"] as const).map((platform) => (
              <label key={platform}>
                <span className="mb-2 block text-[11px] capitalize text-zinc-600">
                  {platform}
                </span>
                <textarea
                  rows={6}
                  value={article.social_copy?.[platform] ?? ""}
                  onChange={(event) =>
                    setArticle((current) => ({
                      ...current,
                      social_copy: {
                        ...(current.social_copy ?? {}),
                        [platform]: event.target.value,
                      },
                    }))
                  }
                  className="editor-input resize-y text-xs leading-6"
                />
              </label>
            ))}
          </div>
        </section>
        <label className="block">
          <span className="mb-2 block text-xs text-zinc-400">摘要</span>
          <textarea
            rows={4}
            value={article.summary}
            onChange={(event) =>
              setArticle((current) => ({
                ...current,
                summary: event.target.value,
              }))
            }
            className="editor-input resize-y leading-7"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs text-zinc-400">內文</span>
          <textarea
            rows={18}
            value={article.content}
            onChange={(event) =>
              setArticle((current) => ({
                ...current,
                content: event.target.value,
              }))
            }
            className="editor-input min-h-96 resize-y leading-8"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="text-xs text-zinc-400">封面圖片</p>
            {article.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.cover_image}
                alt={article.title}
                className="mt-4 aspect-video w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="mt-4 grid aspect-video place-items-center rounded-2xl border border-dashed border-white/10 text-zinc-700">
                <ImagePlus className="size-5" />
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => uploadCover(event.target.files?.[0])}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-3 w-full"
              disabled={busy === "cover"}
              onClick={() => fileRef.current?.click()}
            >
              {busy === "cover" ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <ImagePlus className="size-3.5" />
              )}
              {article.cover_image ? "更換封面" : "上傳封面"}
            </Button>
          </section>

          <label className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
            <span className="text-xs text-zinc-400">影片網址</span>
            <p className="mt-1 text-[11px] leading-5 text-zinc-700">
              可填入 YouTube、Vimeo 或其他影片網址。
            </p>
            <input
              type="url"
              value={article.video_url ?? ""}
              onChange={(event) =>
                setArticle((current) => ({
                  ...current,
                  video_url: event.target.value,
                }))
              }
              placeholder="https://..."
              className="mt-4 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-[#deb5bb]/40"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
