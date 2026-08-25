"use client";

import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  ImagePlus,
  LoaderCircle,
  Trash2,
  Video,
} from "lucide-react";
import { useRef, useState } from "react";

import { MediaLibraryDialog } from "@/components/admin/media-library-dialog";
import { Button } from "@/components/ui/button";
import { parseEmbed } from "@/lib/content/embed";
import {
  MAX_ARTICLE_IMAGES,
  MAX_ARTICLE_VIDEOS,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  countArticleImages,
  countArticleVideos,
  formatBytes,
} from "@/lib/content/limits";
import { optimizeArticleImage } from "@/lib/media/optimize-image";
import { uploadToSignedUrlWithProgress } from "@/lib/media/upload-signed";
import { Html5Video } from "@/components/public/html5-video";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/types/media";
import { articleBlockTypeLabels, type ArticleBlockType, type GalleryLayout } from "@/types/blocks";

export type EditorBlock = {
  clientId: string;
  id?: string;
  type: ArticleBlockType;
  content: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  caption: string;
  source: string;
  altText: string;
  metadata: Record<string, unknown>;
};

type GalleryItem = {
  url: string;
  storagePath?: string;
  bucket?: string;
  mediaAssetId?: string;
  caption?: string;
  alt?: string;
  source?: string;
};

type UploadTarget =
  | { mode: "new"; asGallery?: boolean; afterId?: string }
  | { mode: "gallery"; clientId: string }
  | { mode: "gallery-replace"; clientId: string; index: number }
  | { mode: "replace"; clientId: string }
  | { mode: "poster"; clientId: string };

const PRIMARY_ADD: Array<{ type: ArticleBlockType; label: string }> = [
  { type: "text", label: "文字" },
  { type: "image", label: "圖片" },
  { type: "gallery", label: "多圖" },
  { type: "video", label: "影片" },
  { type: "embed", label: "YouTube" },
  { type: "quote", label: "引言" },
];

const MORE_ADD: Array<{ type: ArticleBlockType; label: string }> = [
  { type: "heading", label: "小標題" },
  { type: "divider", label: "分隔線" },
  { type: "ad", label: "廣告" },
  { type: "related_articles", label: "延伸閱讀" },
];

export function emptyEditorBlock(type: ArticleBlockType): EditorBlock {
  return {
    clientId: crypto.randomUUID(),
    type,
    content: "",
    mediaUrl: null,
    thumbnailUrl: null,
    caption: "",
    source: "",
    altText: "",
    metadata: type === "gallery" ? { layout: "gallery", items: [] } : type === "divider" ? { kind: "divider" } : {},
  };
}

export function toSavePayload(blocks: EditorBlock[]) {
  return blocks.map((block, index) => {
    const stored = typeof block.metadata.storagePath === "string" && block.metadata.storagePath;
    const posterStored =
      typeof block.metadata.posterPath === "string" && block.metadata.posterPath;
    return {
      id: block.id,
      type: block.type,
      sortOrder: index,
      content: block.content,
      mediaUrl: stored ? null : block.mediaUrl,
      thumbnailUrl: stored || posterStored ? null : block.thumbnailUrl,
      caption: block.caption,
      source: block.source,
      altText: block.altText,
      metadata: persistMetadata(block.metadata),
    };
  });
}

function persistMetadata(metadata: Record<string, unknown>) {
  const items = Array.isArray(metadata.items)
    ? metadata.items.map((item) => {
        if (!item || typeof item !== "object") return item;
        const row = { ...(item as Record<string, unknown>) };
        if (typeof row.storagePath === "string" && row.storagePath) {
          delete row.url;
        }
        return row;
      })
    : metadata.items;
  return { ...metadata, items: items ?? metadata.items };
}

function galleryItems(block: EditorBlock): GalleryItem[] {
  return Array.isArray(block.metadata.items)
    ? (block.metadata.items as GalleryItem[])
    : [];
}

function insertBlocks(list: EditorBlock[], added: EditorBlock[], afterId?: string) {
  if (!afterId) return [...list, ...added];
  const index = list.findIndex((block) => block.clientId === afterId);
  if (index < 0) return [...list, ...added];
  const next = [...list];
  next.splice(index + 1, 0, ...added);
  return next;
}

export function BlockEditor({
  blocks,
  onChange,
  ensureArticleId,
}: {
  blocks: EditorBlock[];
  onChange: (blocks: EditorBlock[]) => void;
  ensureArticleId: () => Promise<string>;
}) {
  const [progress, setProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [failures, setFailures] = useState<string[]>([]);
  const [library, setLibrary] = useState<{ kind: "image" | "video"; target: UploadTarget } | null>(null);
  const [dragId, setDragId] = useState("");
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const posterRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<UploadTarget>({ mode: "new" });
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const imageCount = countArticleImages(blocks);
  const videoCount = countArticleVideos(blocks);

  function update(clientId: string, patch: Partial<EditorBlock>) {
    onChange(
      blocksRef.current.map((block) =>
        block.clientId === clientId ? { ...block, ...patch } : block,
      ),
    );
  }

  function move(clientId: string, direction: -1 | 1) {
    const index = blocks.findIndex((block) => block.clientId === clientId);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= blocks.length) return;
    const copy = [...blocks];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange(copy);
  }

  function add(type: ArticleBlockType, afterId?: string) {
    if (type === "image" || type === "gallery") {
      uploadTarget.current = { mode: "new", asGallery: type === "gallery", afterId };
      imageRef.current?.click();
      return;
    }
    if (type === "video") {
      uploadTarget.current = { mode: "new", afterId };
      videoRef.current?.click();
      return;
    }
    onChange(insertBlocks(blocksRef.current, [emptyEditorBlock(type)], afterId));
  }

  async function uploadFiles(files: File[]) {
    let images = files.filter(
      (file) => file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name),
    );
    let videos = files.filter((file) => file.type.startsWith("video/"));
    if (!images.length && !videos.length) {
      setError("請選擇圖片或影片檔。");
      return;
    }
    const target = uploadTarget.current;
    setError("");
    setFailures([]);
    const remainingImages = MAX_ARTICLE_IMAGES - imageCount;
    const remainingVideos = MAX_ARTICLE_VIDEOS - videoCount;
    const nextFailures: string[] = [];
    if (target.mode === "replace" || target.mode === "gallery-replace" || target.mode === "poster") {
      if (images.length > 1) {
        for (const extra of images.slice(1)) {
          nextFailures.push(`${extra.name}：更換時一次只能選 1 張。`);
        }
        images = images.slice(0, 1);
      }
      if (target.mode !== "replace") {
        videos = [];
      } else if (videos.length > 1) {
        videos = videos.slice(0, 1);
      }
    }
    if (target.mode === "new" || target.mode === "gallery") {
      if (images.length > remainingImages) {
        for (const extra of images.slice(Math.max(remainingImages, 0))) {
          nextFailures.push(`${extra.name}：已達 ${MAX_ARTICLE_IMAGES} 張上限，未上傳。`);
        }
        images = images.slice(0, Math.max(remainingImages, 0));
      }
    }
    if (target.mode === "new") {
      if (videos.length > remainingVideos) {
        for (const extra of videos.slice(Math.max(remainingVideos, 0))) {
          nextFailures.push(`${extra.name}：已達 ${MAX_ARTICLE_VIDEOS} 支上限，未上傳。`);
        }
        videos = videos.slice(0, Math.max(remainingVideos, 0));
      }
    }
    if (!images.length && !videos.length) {
      setFailures(nextFailures);
      setError(nextFailures[0] || "沒有可上傳的檔案。");
      return;
    }
    try {
      await ensureArticleId();
      const total = images.length + videos.length;
      let done = 0;
      let ok = 0;
      const uploadedImages: GalleryItem[] = [];
      for (const file of images) {
        done += 1;
        if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
          nextFailures.push(`${file.name}：檔案大於 ${formatBytes(MAX_IMAGE_UPLOAD_BYTES)}，未上傳。`);
          setProgress(`上傳中 ${done}/${total} · 成功 ${ok} · 失敗 ${nextFailures.length}`);
          continue;
        }
        setProgress(`壓縮並上傳 ${done}/${total} ${file.name}`);
        try {
          const optimized = await optimizeArticleImage(file);
          const uploaded = await uploadOne(optimized, "image", (percent) => {
            setProgressPercent(percent);
            setProgress(`上傳 ${done}/${total} ${file.name} ${percent}%`);
          });
          uploadedImages.push({
            url: uploaded.url,
            storagePath: uploaded.path,
            bucket: "content-media",
            mediaAssetId: uploaded.id,
            caption: "",
            alt: "",
            source: "",
          });
          ok += 1;
        } catch (fileError) {
          nextFailures.push(
            `${file.name}：${fileError instanceof Error ? fileError.message : "上傳失敗"}`,
          );
        }
        setProgress(`上傳中 ${done}/${total} · 成功 ${ok} · 失敗 ${nextFailures.length}`);
      }
      const uploadedVideos: Array<{ url: string; path: string; id: string }> = [];
      for (const file of videos) {
        done += 1;
        if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
          nextFailures.push(`${file.name}：影片大於 ${formatBytes(MAX_VIDEO_UPLOAD_BYTES)}，請壓縮後再上傳。`);
          setProgress(`上傳中 ${done}/${total} · 成功 ${ok} · 失敗 ${nextFailures.length}`);
          continue;
        }
        setProgress(`上傳中 ${done}/${total} ${file.name}`);
        try {
          uploadedVideos.push(
            await uploadOne(file, "video", (percent) => {
              setProgressPercent(percent);
              setProgress(`上傳 ${done}/${total} ${file.name} ${percent}%`);
            }),
          );
          ok += 1;
        } catch (fileError) {
          nextFailures.push(
            `${file.name}：${fileError instanceof Error ? fileError.message : "上傳失敗"}`,
          );
        }
        setProgress(`上傳中 ${done}/${total} · 成功 ${ok} · 失敗 ${nextFailures.length}`);
      }
      setFailures(nextFailures);
      applyUploads(target, uploadedImages, uploadedVideos);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上傳失敗。");
    } finally {
      setProgress("");
      setProgressPercent(null);
      uploadTarget.current = { mode: "new" };
    }
  }

  function applyUploads(
    target: UploadTarget,
    uploadedImages: GalleryItem[],
    uploadedVideos: Array<{ url: string; path: string; id: string }>,
  ) {
    if (target.mode === "poster" && uploadedImages[0]) {
      const current = blocksRef.current.find((block) => block.clientId === target.clientId);
      update(target.clientId, {
        thumbnailUrl: uploadedImages[0].url,
        metadata: {
          ...current?.metadata,
          posterPath: uploadedImages[0].storagePath,
          posterBucket: "content-media",
          posterAssetId: uploadedImages[0].mediaAssetId,
        },
      });
      return;
    }
    if (target.mode === "gallery-replace" && uploadedImages[0]) {
      onChange(
        blocksRef.current.map((block) => {
          if (block.clientId !== target.clientId) return block;
          const items = [...galleryItems(block)];
          items[target.index] = { ...items[target.index], ...uploadedImages[0] };
          return { ...block, metadata: { ...block.metadata, items } };
        }),
      );
      return;
    }
    if (target.mode === "gallery") {
      onChange(
        blocksRef.current.map((block) =>
          block.clientId === target.clientId
            ? {
                ...block,
                metadata: {
                  ...block.metadata,
                  items: [...galleryItems(block), ...uploadedImages],
                },
              }
            : block,
        ),
      );
      return;
    }
    if (target.mode === "replace") {
      const current = blocksRef.current.find((block) => block.clientId === target.clientId);
      if (current?.type === "image" && uploadedImages[0]) {
        update(target.clientId, {
          mediaUrl: uploadedImages[0].url,
          thumbnailUrl: uploadedImages[0].url,
          metadata: {
            ...current.metadata,
            storagePath: uploadedImages[0].storagePath,
            bucket: "content-media",
            mediaAssetId: uploadedImages[0].mediaAssetId,
          },
        });
        return;
      }
      if (current?.type === "video" && uploadedVideos[0]) {
        update(target.clientId, {
          mediaUrl: uploadedVideos[0].url,
          metadata: {
            ...current.metadata,
            storagePath: uploadedVideos[0].path,
            bucket: "content-media",
            mediaAssetId: uploadedVideos[0].id,
          },
        });
        return;
      }
    }

    const added: EditorBlock[] = [];
    const asGallery = target.mode === "new" && Boolean(target.asGallery);
    if (asGallery && uploadedImages.length) {
      added.push({
        ...emptyEditorBlock("gallery"),
        metadata: { layout: "gallery", items: uploadedImages },
      });
    } else {
      for (const item of uploadedImages) {
        added.push({
          ...emptyEditorBlock("image"),
          mediaUrl: item.url,
          thumbnailUrl: item.url,
          metadata: {
            storagePath: item.storagePath,
            bucket: "content-media",
            mediaAssetId: item.mediaAssetId,
          },
        });
      }
    }
    for (const uploaded of uploadedVideos) {
      added.push({
        ...emptyEditorBlock("video"),
        mediaUrl: uploaded.url,
        metadata: { storagePath: uploaded.path, bucket: "content-media", mediaAssetId: uploaded.id },
      });
    }
    if (added.length) {
      onChange(insertBlocks(blocksRef.current, added, target.mode === "new" ? target.afterId : undefined));
    }
  }

  function applyLibrary(assets: MediaAsset[]) {
    const target = library?.target ?? uploadTarget.current;
    const remainingImages =
      target.mode === "replace" || target.mode === "poster" || target.mode === "gallery-replace"
        ? 1
        : MAX_ARTICLE_IMAGES - countArticleImages(blocksRef.current);
    const remainingVideos =
      MAX_ARTICLE_VIDEOS - countArticleVideos(blocksRef.current);
    const images: GalleryItem[] = assets
      .filter((asset) => asset.type === "image")
      .map((asset) => ({
        url: asset.signed_url || asset.signed_thumb_url || "",
        storagePath: asset.storage_path,
        bucket: asset.bucket,
        mediaAssetId: asset.id,
        caption: asset.caption,
        alt: asset.alt_text,
        source: asset.source,
      }));
    const videos = assets
      .filter((asset) => asset.type === "video")
      .map((asset) => ({
        url: asset.signed_url || "",
        path: asset.storage_path,
        id: asset.id,
      }));
    const limitedImages =
      target.mode === "replace" || target.mode === "poster" || target.mode === "gallery-replace"
        ? images.slice(0, 1)
        : images.slice(0, Math.max(remainingImages, 0));
    const limitedVideos =
      target.mode === "replace"
        ? videos.slice(0, 1)
        : target.mode === "new"
          ? videos.slice(0, Math.max(remainingVideos, 0))
          : [];
    if (images.length > limitedImages.length || videos.length > limitedVideos.length) {
      setError(
        `已套用可加入的素材；內文圖片最多 ${MAX_ARTICLE_IMAGES} 張、影片最多 ${MAX_ARTICLE_VIDEOS} 支。`,
      );
    }
    applyUploads(target, limitedImages, limitedVideos);
  }

  async function uploadOne(
    file: File,
    type: "image" | "video",
    onProgress?: (percent: number) => void,
  ) {
    const mimeType =
      file.type ||
      (/\.(heic|heif)$/i.test(file.name)
        ? "image/heic"
        : /\.mov$/i.test(file.name)
          ? "video/quicktime"
          : file.type);
    const prepare = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        mimeType,
        sizeBytes: file.size,
        type,
      }),
    });
    const prepared = (await prepare.json()) as {
      asset?: { id: string; storage_path: string };
      upload?: { path: string; token: string };
      error?: string;
    };
    if (!prepare.ok || !prepared.asset || !prepared.upload) {
      throw new Error(prepared.error || "無法準備上傳。");
    }
    await uploadToSignedUrlWithProgress(
      prepared.upload.path,
      prepared.upload.token,
      file,
      onProgress ?? (() => undefined),
    );
    const complete = await fetch(`/api/media/${prepared.asset.id}/complete`, {
      method: "POST",
    });
    const body = (await complete.json()) as {
      asset?: { id?: string; signed_url?: string; signed_thumb_url?: string; storage_path: string };
      error?: string;
    };
    if (!complete.ok || !body.asset) {
      throw new Error(body.error || "上傳驗證失敗。");
    }
    return {
      id: body.asset.id || prepared.asset.id,
      url: body.asset.signed_url || URL.createObjectURL(file),
      path: body.asset.storage_path,
    };
  }

  return (
    <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-4 sm:p-6">
      <div>
        <p className="text-xs text-zinc-400">文章內容</p>
        <p className="mt-1 text-[11px] text-zinc-600">
          圖片 {imageCount}/{MAX_ARTICLE_IMAGES} · 影片 {videoCount}/{MAX_ARTICLE_VIDEOS}
          。封面獨立設定，不會把內文圖混進去。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PRIMARY_ADD.map((item) => (
            <button
              key={item.type}
              type="button"
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-200 hover:border-[#d3b176]/40 hover:text-white"
              onClick={() => add(item.type)}
            >
              ＋ {item.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {MORE_ADD.map((item) => (
            <button
              key={item.type}
              type="button"
              className="rounded-full px-3 py-1.5 text-[11px] text-zinc-500 hover:text-white"
              onClick={() => add(item.type)}
            >
              ＋ {item.label}
            </button>
          ))}
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-[11px] text-zinc-500 hover:text-white"
            onClick={() => setLibrary({ kind: "image", target: { mode: "new" } })}
          >
            從媒體庫選圖
          </button>
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-[11px] text-zinc-500 hover:text-white"
            onClick={() => setLibrary({ kind: "video", target: { mode: "new" } })}
          >
            從媒體庫選影片
          </button>
        </div>
      </div>

      <input
        ref={imageRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
        multiple
        className="sr-only"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          if (files.length) void uploadFiles(files);
        }}
      />
      <input
        ref={videoRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        multiple
        className="sr-only"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          if (files.length) void uploadFiles(files);
        }}
      />
      <input
        ref={posterRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          if (files.length) void uploadFiles(files);
        }}
      />

      {error ? <p className="mt-4 text-xs text-rose-300">{error}</p> : null}
      {progress ? (
        <div className="mt-4 space-y-2">
          <p className="flex items-center gap-2 text-xs text-zinc-500">
            <LoaderCircle className="size-3.5 animate-spin" />
            {progress}
          </p>
          {progressPercent != null ? (
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#d3b176] transition-[width]"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {failures.length ? (
        <ul className="mt-3 space-y-1 text-[11px] text-rose-300">
          {failures.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      <div
        className="mt-5 rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-zinc-600"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const files = [...event.dataTransfer.files];
          const imageCountDrop = files.filter((file) => file.type.startsWith("image/")).length;
          uploadTarget.current = { mode: "new", asGallery: imageCountDrop > 1 };
          if (files.length) void uploadFiles(files);
        }}
      >
        把圖片或影片拖到這裡。一次可選多張；其中一張失敗不會讓其他張一起失敗。影片上限 {formatBytes(MAX_VIDEO_UPLOAD_BYTES)}。
      </div>

      <div className="mt-5 space-y-3">
        {blocks.length ? (
          blocks.map((block, index) => (
            <article
              key={block.clientId}
              className={cn(
                "rounded-2xl border border-white/[0.07] bg-black/20 p-3 sm:p-4",
                dragId === block.clientId && "opacity-50",
              )}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const fromId = event.dataTransfer.getData("text/block-id");
                if (!fromId || fromId === block.clientId) return;
                const from = blocks.findIndex((item) => item.clientId === fromId);
                const to = blocks.findIndex((item) => item.clientId === block.clientId);
                if (from < 0 || to < 0) return;
                const copy = [...blocks];
                const [item] = copy.splice(from, 1);
                copy.splice(to, 0, item);
                onChange(copy);
                setDragId("");
              }}
            >
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/block-id", block.clientId);
                    setDragId(block.clientId);
                  }}
                  onDragEnd={() => setDragId("")}
                  className="cursor-grab rounded-full p-1 hover:bg-white/10"
                  aria-label="拖曳排序"
                >
                  <GripVertical className="size-4" />
                </button>
                <span className="rounded-full bg-white/[0.04] px-2 py-1">
                  {block.type === "embed" ? "YouTube" : block.type === "gallery" ? "多圖" : articleBlockTypeLabels[block.type]}
                </span>
                <span className="ml-auto" />
                <button type="button" onClick={() => move(block.clientId, -1)} disabled={index === 0} className="rounded-full p-1 hover:bg-white/10 disabled:opacity-30">
                  <ChevronUp className="size-4" />
                </button>
                <button type="button" onClick={() => move(block.clientId, 1)} disabled={index === blocks.length - 1} className="rounded-full p-1 hover:bg-white/10 disabled:opacity-30">
                  <ChevronDown className="size-4" />
                </button>
                <button type="button" onClick={() => onChange(blocks.filter((item) => item.clientId !== block.clientId))} className="rounded-full p-1 text-zinc-600 hover:text-white">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <BlockFields
                block={block}
                onChange={(patch) => update(block.clientId, patch)}
                onPickImages={() => {
                  uploadTarget.current =
                    block.type === "gallery"
                      ? { mode: "gallery", clientId: block.clientId }
                      : { mode: "replace", clientId: block.clientId };
                  imageRef.current?.click();
                }}
                onPickVideo={() => {
                  uploadTarget.current = { mode: "replace", clientId: block.clientId };
                  videoRef.current?.click();
                }}
                onPickPoster={() => {
                  uploadTarget.current = { mode: "poster", clientId: block.clientId };
                  posterRef.current?.click();
                }}
                onLibrary={() =>
                  setLibrary({
                    kind: block.type === "video" ? "video" : "image",
                    target:
                      block.type === "gallery"
                        ? { mode: "gallery", clientId: block.clientId }
                        : { mode: "replace", clientId: block.clientId },
                  })
                }
                onReplaceGalleryImage={(index) => {
                  uploadTarget.current = {
                    mode: "gallery-replace",
                    clientId: block.clientId,
                    index,
                  };
                  imageRef.current?.click();
                }}
                onLibraryGalleryImage={(index) =>
                  setLibrary({
                    kind: "image",
                    target: {
                      mode: "gallery-replace",
                      clientId: block.clientId,
                      index,
                    },
                  })
                }
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {PRIMARY_ADD.map((item) => (
                  <button
                    key={`${block.clientId}-${item.type}`}
                    type="button"
                    className="text-[10px] text-zinc-600 hover:text-[#d3b176]"
                    onClick={() => add(item.type, block.clientId)}
                  >
                    在下方插入{item.label}
                  </button>
                ))}
              </div>
            </article>
          ))
        ) : (
          <p className="py-6 text-center text-sm text-zinc-600">還沒有內容區塊。請用上方按鈕加入文字或圖片。</p>
        )}
      </div>
      <MediaLibraryDialog
        open={Boolean(library)}
        kind={library?.kind ?? "image"}
        onClose={() => setLibrary(null)}
        onPick={applyLibrary}
      />
    </section>
  );
}

function BlockFields({
  block,
  onChange,
  onPickImages,
  onPickVideo,
  onPickPoster,
  onLibrary,
  onReplaceGalleryImage,
  onLibraryGalleryImage,
}: {
  block: EditorBlock;
  onChange: (patch: Partial<EditorBlock>) => void;
  onPickImages: () => void;
  onPickVideo: () => void;
  onPickPoster: () => void;
  onLibrary: () => void;
  onReplaceGalleryImage: (index: number) => void;
  onLibraryGalleryImage: (index: number) => void;
}) {
  if (block.type === "divider") {
    return <hr className="mt-4 border-white/10" />;
  }
  if (block.type === "text" || block.type === "heading" || block.type === "quote") {
    return (
      <textarea
        rows={block.type === "heading" ? 2 : 5}
        value={block.content}
        onChange={(event) => onChange({ content: event.target.value })}
        className="editor-input mt-3 min-h-20 resize-y text-sm leading-7"
        placeholder={block.type === "quote" ? "引言" : block.type === "heading" ? "小標題" : "文字段落"}
      />
    );
  }
  if (block.type === "embed") {
    const url = String(block.metadata.url ?? block.mediaUrl ?? "");
    const parsed = parseEmbed(url);
    return (
      <div className="mt-3 space-y-3">
        <input
          value={url}
          onChange={(event) =>
            onChange({
              mediaUrl: event.target.value,
              metadata: { ...block.metadata, url: event.target.value },
            })
          }
          placeholder="貼上 YouTube 或 YouTube Shorts 網址"
          className="editor-input font-mono text-xs"
        />
        {parsed?.kind === "iframe" && parsed.embedUrl ? (
          <div className="aspect-video overflow-hidden rounded-xl bg-black">
            <iframe
              src={parsed.embedUrl}
              title={block.caption || parsed.provider}
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : url.trim() ? (
          <p className="text-[11px] text-zinc-500">請貼入有效的 YouTube 網址。</p>
        ) : null}
      </div>
    );
  }
  if (block.type === "related_articles") {
    return (
      <textarea
        rows={3}
        value={block.content}
        onChange={(event) =>
          onChange({
            content: event.target.value,
            metadata: {
              slugs: event.target.value
                .split(/\s+/)
                .map((item) => item.trim())
                .filter(Boolean),
            },
          })
        }
        placeholder="每行一個文章 slug"
        className="editor-input mt-3 font-mono text-xs"
      />
    );
  }
  if (block.type === "ad") {
    return <p className="mt-3 text-xs text-zinc-500">此位置會顯示文章內文廣告（A4）。</p>;
  }
  if (block.type === "video") {
    return (
      <div className="mt-3 space-y-3">
        {block.mediaUrl ? (
          <Html5Video
            src={block.mediaUrl}
            poster={block.thumbnailUrl}
            className="mt-0"
          />
        ) : (
          <button type="button" onClick={onPickVideo} className="grid aspect-video w-full place-items-center rounded-xl border border-dashed border-white/10 text-zinc-600">
            <Video className="size-5" />
          </button>
        )}
        <CaptionFields block={block} onChange={onChange} />
        <div className="flex flex-wrap gap-3 text-xs text-[#d3b176]">
          <button type="button" onClick={onPickVideo}>
            更換影片
          </button>
          <button type="button" onClick={onPickPoster}>
            {block.thumbnailUrl ? "更換 poster" : "設定 poster 封面"}
          </button>
          <button type="button" onClick={onLibrary}>
            從媒體庫選擇
          </button>
        </div>
      </div>
    );
  }
  if (block.type === "image") {
    return (
      <div className="mt-3 space-y-3">
        {block.mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={block.mediaUrl} alt={block.altText} className="h-auto w-full rounded-xl" />
        ) : (
          <button type="button" onClick={onPickImages} className="grid aspect-video w-full place-items-center rounded-xl border border-dashed border-white/10 text-zinc-600">
            <ImagePlus className="size-5" />
          </button>
        )}
        <CaptionFields block={block} onChange={onChange} />
        <div className="flex flex-wrap gap-3 text-xs text-[#d3b176]">
          <button type="button" onClick={onPickImages}>
            更換圖片
          </button>
          {block.mediaUrl ? (
            <a href={block.mediaUrl} target="_blank" rel="noreferrer">
              預覽
            </a>
          ) : null}
          <button type="button" onClick={onLibrary}>
            從媒體庫選擇
          </button>
        </div>
      </div>
    );
  }
  const items = galleryItems(block);
  const layout = String(block.metadata.layout ?? "gallery") as GalleryLayout;
  return (
    <div className="mt-3 space-y-3">
      <select
        value={layout}
        onChange={(event) =>
          onChange({ metadata: { ...block.metadata, layout: event.target.value } })
        }
        className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs"
      >
        <option value="single">單張大圖</option>
        <option value="two">2 欄排列</option>
        <option value="three">3 欄排列</option>
        <option value="gallery">Gallery 圖集</option>
        <option value="carousel">Carousel 輪播</option>
      </select>
      <div className={cn("grid gap-2", layout === "three" ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {items.map((item, index) => (
          <div
            key={`${item.url}-${index}`}
            className="rounded-xl border border-white/[0.06] p-2"
            draggable
            onDragStart={(event) => {
              event.stopPropagation();
              event.dataTransfer.setData("text/gallery-index", String(index));
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const from = Number(event.dataTransfer.getData("text/gallery-index"));
              if (Number.isNaN(from) || from === index) return;
              const next = [...items];
              const [moved] = next.splice(from, 1);
              next.splice(index, 0, moved);
              onChange({ metadata: { ...block.metadata, items: next } });
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.alt || ""} className="h-28 w-full rounded-lg object-cover" />
            <input
              value={item.caption ?? ""}
              onChange={(event) => {
                const next = [...items];
                next[index] = { ...item, caption: event.target.value };
                onChange({ metadata: { ...block.metadata, items: next } });
              }}
              placeholder="圖片說明"
              className="mt-1 w-full bg-transparent text-[11px] outline-none"
            />
            <input
              value={item.alt ?? ""}
              onChange={(event) => {
                const next = [...items];
                next[index] = { ...item, alt: event.target.value };
                onChange({ metadata: { ...block.metadata, items: next } });
              }}
              placeholder="ALT"
              className="mt-1 w-full bg-transparent text-[11px] outline-none"
            />
            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-zinc-500">
              <span>可拖曳排序</span>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer" className="text-[#d3b176]">
                  預覽
                </a>
              ) : null}
              <button type="button" className="text-[#d3b176]" onClick={() => onReplaceGalleryImage(index)}>
                更換
              </button>
              <button type="button" onClick={() => onLibraryGalleryImage(index)}>
                媒體庫
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    metadata: {
                      ...block.metadata,
                      items: items.filter((_, itemIndex) => itemIndex !== index),
                    },
                  })
                }
              >
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onPickImages}>
          <ImagePlus className="size-3.5" />
          再加圖片
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onLibrary}>
          從媒體庫選擇
        </Button>
      </div>
    </div>
  );
}

function CaptionFields({
  block,
  onChange,
}: {
  block: EditorBlock;
  onChange: (patch: Partial<EditorBlock>) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <input
        value={block.caption}
        onChange={(event) => onChange({ caption: event.target.value })}
        placeholder="圖片說明 Caption"
        className="h-9 rounded-lg border border-white/10 bg-black/20 px-3 text-xs"
      />
      <input
        value={block.source}
        onChange={(event) => onChange({ source: event.target.value })}
        placeholder="來源"
        className="h-9 rounded-lg border border-white/10 bg-black/20 px-3 text-xs"
      />
      <input
        value={block.altText}
        onChange={(event) => onChange({ altText: event.target.value })}
        placeholder="ALT Text"
        className="h-9 rounded-lg border border-white/10 bg-black/20 px-3 text-xs"
      />
    </div>
  );
}
