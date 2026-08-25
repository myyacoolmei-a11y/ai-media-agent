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
import { useEffect, useRef, useState } from "react";

import { ArticleBlockEditor } from "@/components/admin/article-block-editor";
import { Button } from "@/components/ui/button";
import {
  MAX_ARTICLE_IMAGE_BLOCKS,
  MAX_ARTICLE_IMAGE_BLOCKS_MESSAGE,
  blocksToPlainText,
  countImageBlocks,
  hasPublishableArticleBody,
  hydrateArticleBlocksFromContent,
  withoutCoverImageBlocks,
  type ArticleBlock,
} from "@/lib/content/article-blocks";
import {
  DEFAULT_CATEGORY,
  MEDIA_SECTIONS,
  composeCategory,
  getSectionByLabel,
  getSectionBySlug,
  parseCategory,
} from "@/lib/content/categories";
import { toDatetimeLocalValue } from "@/lib/content/dates";
import { createContentSlug, normalizeSlug } from "@/lib/content/slug";
import { optimizeArticleImage, isLikelyImageFile } from "@/lib/media/optimize-image";
import { mapMediaError } from "@/lib/media/upload-errors";
import { normalizeVideoUrl } from "@/lib/content/video";
import type { ContentAsset, ContentItem, ContentType } from "@/types/content";
import { contentTypeLabels } from "@/types/content";

type FormState = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  video_url: string;
  content_type: ContentType;
  category: string;
  status: ContentItem["status"];
  cover_asset_id: string | null;
  cover_image: string | null;
  published_at: string | null;
};

function emptyForm(): FormState {
  return {
    title: "",
    slug: "",
    summary: "",
    content: "",
    video_url: "",
    content_type: "article",
    category: DEFAULT_CATEGORY,
    status: "draft",
    cover_asset_id: null,
    cover_image: null,
    published_at: null,
  };
}

function fromContent(content: ContentItem): FormState {
  return {
    id: content.id,
    title: content.title,
    slug: content.slug,
    summary: content.summary,
    content: content.content,
    video_url: content.video_url ?? "",
    content_type: content.content_type,
    category: content.category || DEFAULT_CATEGORY,
    status: content.status,
    cover_asset_id: content.cover_asset_id,
    cover_image: content.cover_image ?? null,
    published_at: content.published_at,
  };
}

export function ContentForm({
  initialContent,
}: {
  initialContent?: ContentItem;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [article, setArticle] = useState<FormState>(
    initialContent ? fromContent(initialContent) : emptyForm(),
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(
    initialContent?.cover_image ?? null,
  );
  const [blocks, setBlocks] = useState<ArticleBlock[]>(() =>
    hydrateArticleBlocksFromContent(initialContent ?? { content: "" }),
  );
  const [uploadingBlockId, setUploadingBlockId] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  function payload(next: FormState, nextBlocks = blocks) {
    const bodyBlocks = withoutCoverImageBlocks(
      nextBlocks,
      next.cover_asset_id,
    );
    return {
      title: next.title,
      slug: next.slug || createContentSlug(next.title),
      summary: next.summary,
      content: blocksToPlainText(bodyBlocks) || next.content,
      videoUrl: normalizeVideoUrl(next.video_url),
      category: next.category || DEFAULT_CATEGORY,
      contentType: next.content_type,
      styleProfileId: null,
      coverAssetId: next.cover_asset_id,
      publishedAt: next.published_at ?? "",
      articleBlocks: bodyBlocks,
    };
  }

  async function createDraft(next: FormState) {
    const response = await fetch("/api/contents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload(next),
        coverAssetId: undefined,
      }),
    });
    const body = (await response.json()) as {
      content?: ContentItem;
      error?: string;
    };
    if (!response.ok || !body.content) {
      throw new Error(body.error || "無法建立報導。");
    }
    return body.content;
  }

  async function saveFields(next: FormState, nextBlocks = blocks) {
    if (!next.id) throw new Error("找不到內容。");
    const response = await fetch(`/api/contents/${next.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(next, nextBlocks)),
    });
    const body = (await response.json()) as {
      content?: ContentItem;
      error?: string;
    };
    if (!response.ok || !body.content) {
      throw new Error(body.error || "儲存失敗。");
    }
    return body.content;
  }

  async function uploadImageAsset(contentId: string, file: File) {
    let processed: File;
    try {
      processed = await optimizeArticleImage(file);
    } catch (error) {
      console.error("article image optimize failed", error);
      throw new Error(mapMediaError(error, "圖片處理失敗，請重新選擇圖片"));
    }

    const form = new FormData();
    form.set("file", processed, processed.name);
    const response = await fetch(`/api/contents/${contentId}/assets/upload`, {
      method: "POST",
      body: form,
    });
    const payload = (await response.json()) as {
      asset?: Pick<ContentAsset, "id" | "storage_path"> & {
        signed_url?: string;
      };
      error?: string;
    };
    if (!response.ok || !payload.asset?.id || !payload.asset.signed_url) {
      console.error("article image upload failed", payload);
      throw new Error(
        mapMediaError(
          payload.error || `HTTP ${response.status}`,
          "圖片上傳失敗。",
        ),
      );
    }
    if (
      payload.asset.signed_url.startsWith("blob:") ||
      payload.asset.signed_url.startsWith("data:")
    ) {
      throw new Error("圖片上傳失敗：未取得有效 Storage 網址。");
    }
    return payload.asset;
  }

  async function uploadCover(contentId: string, file: File) {
    const uploadedAsset = await uploadImageAsset(contentId, file);
    const refreshed = await fetch(`/api/contents/${contentId}`, {
      cache: "no-store",
    });
    const data = (await refreshed.json()) as { content?: ContentItem };
    if (!data.content) {
      throw new Error("無法讀取已上傳封面。");
    }
    return {
      ...data.content,
      cover_asset_id: uploadedAsset.id,
      cover_image: uploadedAsset.signed_url ?? null,
    } satisfies ContentItem;
  }

  async function ensureArticleId(next = article) {
    if (next.id) return next;
    if (!next.title.trim()) {
      throw new Error("請先填寫標題，才能上傳內文圖片。");
    }
    const created = await createDraft({
      ...next,
      slug: normalizeSlug(next.slug) || createContentSlug(next.title),
    });
    const withId = {
      ...fromContent(created),
      ...next,
      id: created.id,
      slug: created.slug,
    };
    setArticle(withId);
    router.replace(`/admin/content/${created.id}/edit`);
    return withId;
  }

  async function uploadBodyImage(blockId: string, file: File) {
    if (!isLikelyImageFile(file)) {
      setError("圖片上傳失敗：檔案格式不支援");
      return;
    }
    setError("");
    setUploadingBlockId(blockId);
    setUploadStatus("圖片處理中");
    try {
      const current = await ensureArticleId();
      if (!current.id) throw new Error("找不到內容。");
      setUploadStatus("圖片上傳中");
      const uploaded = await uploadImageAsset(current.id, file);
      if (!uploaded.signed_url) {
        throw new Error("圖片上傳失敗：未取得有效 Storage 網址。");
      }
      let nextBlocks: ArticleBlock[] = [];
      setBlocks((currentBlocks) => {
        nextBlocks = currentBlocks.map((block) =>
          block.id === blockId && block.type === "image"
            ? {
                ...block,
                data: {
                  ...block.data,
                  url: uploaded.signed_url ?? "",
                  assetId: uploaded.id,
                  storagePath: uploaded.storage_path,
                },
              }
            : block,
        );
        return nextBlocks;
      });
      if (!nextBlocks.some((block) => block.id === blockId && block.type === "image")) {
        throw new Error("圖片上傳失敗：找不到對應的圖片區塊。");
      }
      const saved = await saveFields(current, nextBlocks);
      const reloaded = hydrateArticleBlocksFromContent(saved);
      setBlocks(
        reloaded.map((block) =>
          block.id === blockId &&
          block.type === "image" &&
          !block.data.url &&
          uploaded.signed_url
            ? {
                ...block,
                data: {
                  ...block.data,
                  url: uploaded.signed_url,
                  assetId: uploaded.id,
                  storagePath: uploaded.storage_path,
                },
              }
            : block,
        ),
      );
    } catch (uploadError) {
      console.error("article body image upload failed", uploadError);
      setError(mapMediaError(uploadError, "圖片上傳失敗。"));
    } finally {
      setUploadingBlockId("");
      setUploadStatus("");
    }
  }

  async function setStatus(contentId: string, status: "draft" | "published") {
    const response = await fetch(`/api/contents/${contentId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = (await response.json()) as {
      content?: ContentItem;
      error?: string;
    };
    if (!response.ok || !body.content) {
      throw new Error(body.error || (status === "published" ? "發布失敗。" : "取消發布失敗。"));
    }
    return body.content;
  }

  async function persist(nextStatus?: "draft" | "published") {
    setBusy(nextStatus === "published" ? "publish" : "save");
    setError("");
    try {
      let next = {
        ...article,
        slug: normalizeSlug(article.slug) || createContentSlug(article.title),
        video_url: normalizeVideoUrl(article.video_url),
      };
      if (!next.title.trim()) {
        throw new Error("請先填寫標題。");
      }
      if (
        countImageBlocks(withoutCoverImageBlocks(blocks, next.cover_asset_id)) >
        MAX_ARTICLE_IMAGE_BLOCKS
      ) {
        throw new Error(MAX_ARTICLE_IMAGE_BLOCKS_MESSAGE);
      }
      if (
        nextStatus === "published" &&
        (!next.summary.trim() || !hasPublishableArticleBody(blocks))
      ) {
        throw new Error("發布前必須完成摘要與內文。");
      }

      if (!next.id) {
        const created = await createDraft(next);
        next = { ...fromContent(created), ...next, id: created.id, slug: created.slug };
        router.replace(`/admin/content/${created.id}/edit`);
      }

      if (coverFile && next.id) {
        const withCover = await uploadCover(next.id, coverFile);
        next = {
          ...next,
          ...fromContent(withCover),
          title: next.title,
          slug: next.slug,
          summary: next.summary,
          content: next.content,
          video_url: next.video_url,
          content_type: next.content_type,
          category: next.category,
          published_at: next.published_at,
        };
        setCoverFile(null);
        setCoverPreview(withCover.cover_image ?? null);
      }

      const savedContent = await saveFields(next, blocks);
      next = {
        ...next,
        ...fromContent(savedContent),
        content: blocksToPlainText(blocks) || next.content,
      };
      if (Array.isArray(savedContent.article_blocks)) {
        setBlocks(hydrateArticleBlocksFromContent(savedContent));
      }

      if (nextStatus === "published" && next.id) {
        const published = await setStatus(next.id, "published");
        next = { ...next, ...fromContent(published) };
      }

      setArticle(next);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1200);
      router.refresh();
    } catch (persistError) {
      setError(
        persistError instanceof Error ? persistError.message : "儲存失敗。",
      );
    } finally {
      setBusy("");
    }
  }

  async function unpublish() {
    if (!article.id) return;
    setBusy("unpublish");
    setError("");
    try {
      const next = await setStatus(article.id, "draft");
      setArticle((current) => ({ ...current, ...fromContent(next) }));
      router.refresh();
    } catch (unpublishError) {
      setError(
        unpublishError instanceof Error ? unpublishError.message : "取消發布失敗。",
      );
    } finally {
      setBusy("");
    }
  }

  function chooseCover(file?: File) {
    if (!file) return;
    if (!isLikelyImageFile(file)) {
      setError("封面必須是圖片檔案。");
      return;
    }
    if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  const preview = coverPreview || article.cover_image;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/content"
            className="grid size-9 place-items-center rounded-full border border-white/[0.08] text-zinc-600 hover:text-white"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <p className="text-[10px] text-zinc-600">
              {article.status === "published" ? "已發布" : "草稿"}
            </p>
            <h1 className="mt-1 text-lg font-medium">
              {article.title || (article.id ? "未命名報導" : "新增報導")}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={Boolean(busy)}
            onClick={() => persist("draft")}
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
            <Button
              size="sm"
              variant="secondary"
              disabled={Boolean(busy)}
              onClick={unpublish}
            >
              {busy === "unpublish" ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : null}
              取消發布
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={Boolean(busy)}
              onClick={() => persist("published")}
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

      {error ? (
        <p className="mt-5 rounded-xl bg-red-300/[0.07] p-3 text-xs text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-7 space-y-6">
        <label className="block">
          <span className="mb-2 block text-xs text-zinc-400">標題</span>
          <input
            value={article.title}
            onChange={(event) =>
              setArticle((current) => ({ ...current, title: event.target.value }))
            }
            className="editor-input text-xl font-medium"
            placeholder="報導標題"
          />
        </label>
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
            placeholder="前台列表與首頁會顯示這段摘要"
          />
        </label>
        <ArticleBlockEditor
          blocks={blocks}
          onChange={setBlocks}
          disabled={Boolean(busy)}
          uploadingId={uploadingBlockId}
          onUploadImage={uploadBodyImage}
          onError={setError}
          statusText={uploadStatus}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="text-xs text-zinc-400">封面圖片</p>
            <p className="mt-1 text-[11px] leading-5 text-zinc-600">
              封面只能 1 張，用於列表與分享。內文圖片請在上方文章內容插入。
            </p>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
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
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp"
              className="sr-only"
              onChange={(event) => chooseCover(event.target.files?.[0])}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-3 w-full"
              disabled={busy === "cover"}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="size-3.5" />
              {preview ? "更換封面" : "上傳封面"}
            </Button>
          </section>

          <div className="space-y-5">
            <label className="block rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
              <span className="text-xs text-zinc-400">影片網址</span>
              <p className="mt-1 text-[11px] leading-5 text-zinc-600">
                可填 YouTube、Vimeo 或直接影片檔網址。填了就會出現在影音報導。
              </p>
              <input
                type="url"
                value={article.video_url}
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
            <CategoryFields
              value={article.category}
              onChange={(category) =>
                setArticle((current) => ({ ...current, category }))
              }
            />
            <label className="block rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
              <span className="text-xs text-zinc-400">內容類型</span>
              <select
                value={article.content_type}
                onChange={(event) =>
                  setArticle((current) => ({
                    ...current,
                    content_type: event.target.value as ContentType,
                  }))
                }
                className="mt-4 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-[#deb5bb]/40"
              >
                <option value="article">一般報導</option>
                <option value="video">影音報導</option>
                {article.content_type !== "article" &&
                article.content_type !== "video" ? (
                  <option value={article.content_type}>
                    {contentTypeLabels[article.content_type]}
                  </option>
                ) : null}
              </select>
            </label>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
            <span className="text-xs text-zinc-400">草稿／發布狀態</span>
            <p className="mt-3 text-sm text-white">
              {article.status === "published" ? "已發布" : "草稿"}
            </p>
            <p className="mt-2 text-[11px] leading-5 text-zinc-600">
              儲存草稿不會出現在前台；按下發布後，符合發布時間的內容才會公開。
            </p>
          </label>
          <label className="block rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
            <span className="text-xs text-zinc-400">發布時間</span>
            <input
              type="datetime-local"
              value={toDatetimeLocalValue(article.published_at)}
              onChange={(event) =>
                setArticle((current) => ({
                  ...current,
                  published_at: event.target.value
                    ? new Date(event.target.value).toISOString()
                    : null,
                }))
              }
              className="mt-4 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-[#deb5bb]/40"
            />
            <p className="mt-2 text-[11px] leading-5 text-zinc-600">
              若時間在未來，前台會等到該時間才顯示。空白時會在按下發布當下寫入。
            </p>
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs text-zinc-400">網址代稱（slug）</span>
          <input
            value={article.slug}
            onChange={(event) =>
              setArticle((current) => ({ ...current, slug: event.target.value }))
            }
            placeholder="留空會自動產生"
            className="editor-input font-mono text-xs"
          />
        </label>
      </div>
    </div>
  );
}

function CategoryFields({
  value,
  onChange,
}: {
  value: string;
  onChange: (category: string) => void;
}) {
  const parsed = parseCategory(value);
  const section =
    getSectionByLabel(parsed.section) ?? getSectionBySlug("local") ?? MEDIA_SECTIONS[0];
  const selectedTopic =
    section.topics.find((topic) => topic.label === parsed.topic) ?? null;
  const known = Boolean(getSectionByLabel(parsed.section));

  return (
    <>
      <label className="block rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
        <span className="text-xs text-zinc-400">主分類</span>
        <select
          value={section.slug}
          onChange={(event) => {
            const next = getSectionBySlug(event.target.value);
            if (!next) return;
            onChange(composeCategory(next.label));
          }}
          className="mt-4 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-[#deb5bb]/40"
        >
          {MEDIA_SECTIONS.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.label}
            </option>
          ))}
        </select>
        {!known && value ? (
          <p className="mt-2 text-[11px] leading-5 text-zinc-600">
            原分類「{value}」會在儲存時改為所選主分類。
          </p>
        ) : null}
      </label>
      <label className="block rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
        <span className="text-xs text-zinc-400">次分類</span>
        {section.topics.length ? (
          <select
            value={selectedTopic?.slug ?? ""}
            onChange={(event) => {
              const topic = section.topics.find(
                (item) => item.slug === event.target.value,
              );
              onChange(composeCategory(section.label, topic?.label));
            }}
            className="mt-4 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-[#deb5bb]/40"
          >
            <option value="">不指定次分類</option>
            {section.topics.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.label}
              </option>
            ))}
          </select>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">此主分類目前沒有次分類。</p>
        )}
      </label>
    </>
  );
}
