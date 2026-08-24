"use client";

import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  LoaderCircle,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { articleBlockTypeLabels, type ArticleBlockType, type GalleryLayout } from "@/types/blocks";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
  caption?: string;
  alt?: string;
  source?: string;
};

type UploadTarget =
  | { mode: "new"; asGallery?: boolean }
  | { mode: "gallery"; clientId: string }
  | { mode: "replace"; clientId: string }
  | { mode: "poster"; clientId: string };

const ADDABLE: ArticleBlockType[] = [
  "text",
  "heading",
  "image",
  "gallery",
  "video",
  "embed",
  "quote",
  "ad",
  "related_articles",
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
    metadata: type === "gallery" ? { layout: "gallery", items: [] } : {},
  };
}

export function toSavePayload(blocks: EditorBlock[]) {
  return blocks.map((block, index) => ({
    id: block.id,
    type: block.type,
    sortOrder: index,
    content: block.content,
    mediaUrl: block.mediaUrl,
    thumbnailUrl: block.thumbnailUrl,
    caption: block.caption,
    source: block.source,
    altText: block.altText,
    metadata: block.metadata,
  }));
}

function galleryItems(block: EditorBlock): GalleryItem[] {
  return Array.isArray(block.metadata.items)
    ? (block.metadata.items as GalleryItem[])
    : [];
}

export function BlockEditor({
  blocks,
  onChange,
  ensureArticleId,
  onSetCover,
}: {
  blocks: EditorBlock[];
  onChange: (blocks: EditorBlock[]) => void;
  ensureArticleId: () => Promise<string>;
  onSetCover: (previewUrl: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const posterRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<UploadTarget>({ mode: "new" });
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

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

  function add(type: ArticleBlockType) {
    setMenuOpen(false);
    if (type === "image" || type === "gallery") {
      uploadTarget.current = { mode: "new", asGallery: type === "gallery" };
      imageRef.current?.click();
      return;
    }
    if (type === "video") {
      uploadTarget.current = { mode: "new" };
      videoRef.current?.click();
      return;
    }
    onChange([...blocks, emptyEditorBlock(type)]);
  }

  async function uploadFiles(files: File[]) {
    const images = files.filter((file) => file.type.startsWith("image/"));
    const videos = files.filter((file) => file.type.startsWith("video/"));
    if (!images.length && !videos.length) {
      setError("請選擇圖片或影片檔。");
      return;
    }
    const target = uploadTarget.current;
    setError("");
    try {
      await ensureArticleId();
      const total = images.length + videos.length;
      let done = 0;
      const uploadedImages: GalleryItem[] = [];
      for (const file of images) {
        done += 1;
        setProgress(`上傳中 ${done}/${total} ${file.name}`);
        const uploaded = await uploadOne(file, "image");
        uploadedImages.push({
          url: uploaded.url,
          storagePath: uploaded.path,
          bucket: "content-media",
          caption: "",
          alt: "",
          source: "",
        });
      }
      const uploadedVideos: Array<{ url: string; path: string }> = [];
      for (const file of videos) {
        done += 1;
        setProgress(`上傳中 ${done}/${total} ${file.name}`);
        uploadedVideos.push(await uploadOne(file, "video"));
      }

      if (target.mode === "poster" && uploadedImages[0]) {
        update(target.clientId, { thumbnailUrl: uploadedImages[0].url });
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
            },
          });
          return;
        }
      }

      const next = [...blocksRef.current];
      const asGallery = target.mode === "new" && Boolean(target.asGallery);
      if (asGallery || uploadedImages.length > 1) {
        next.push({
          ...emptyEditorBlock("gallery"),
          metadata: {
            layout: asGallery ? "gallery" : uploadedImages.length > 2 ? "three" : "two",
            items: uploadedImages,
          },
        });
      } else if (uploadedImages[0]) {
        next.push({
          ...emptyEditorBlock("image"),
          mediaUrl: uploadedImages[0].url,
          thumbnailUrl: uploadedImages[0].url,
          metadata: {
            storagePath: uploadedImages[0].storagePath,
            bucket: "content-media",
          },
        });
      }
      for (const uploaded of uploadedVideos) {
        next.push({
          ...emptyEditorBlock("video"),
          mediaUrl: uploaded.url,
          metadata: { storagePath: uploaded.path, bucket: "content-media" },
        });
      }
      onChange(next);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上傳失敗。");
    } finally {
      setProgress("");
      uploadTarget.current = { mode: "new" };
    }
  }

  async function uploadOne(file: File, type: "image" | "video") {
    const prepare = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
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
    const { error: uploadError } = await createClient()
      .storage.from("content-media")
      .uploadToSignedUrl(prepared.upload.path, prepared.upload.token, file, {
        contentType: file.type,
      });
    if (uploadError) throw uploadError;
    const complete = await fetch(`/api/media/${prepared.asset.id}/complete`, {
      method: "POST",
    });
    const body = (await complete.json()) as {
      asset?: { signed_url?: string; signed_thumb_url?: string; storage_path: string };
      error?: string;
    };
    if (!complete.ok || !body.asset) {
      throw new Error(body.error || "上傳驗證失敗。");
    }
    return {
      url: body.asset.signed_url || URL.createObjectURL(file),
      path: body.asset.storage_path,
    };
  }

  return (
    <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-400">內容區塊</p>
          <p className="mt-1 text-[11px] text-zinc-600">
            可任意插入文字、多張圖片、影片與廣告，並上下調整順序。
          </p>
        </div>
        <div className="relative">
          <Button size="sm" variant="secondary" type="button" onClick={() => setMenuOpen((open) => !open)}>
            <Plus className="size-3.5" />
            新增區塊
          </Button>
          {menuOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-44 rounded-2xl border border-white/10 bg-[#121012] p-1 shadow-xl">
              {ADDABLE.map((type) => (
                <button
                  key={type}
                  type="button"
                  className="block w-full rounded-xl px-3 py-2 text-left text-xs text-zinc-300 hover:bg-white/[0.05]"
                  onClick={() => add(type)}
                >
                  ＋ {articleBlockTypeLabels[type]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <input
        ref={imageRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
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
        accept="video/mp4,video/quicktime,video/webm"
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
        <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
          <LoaderCircle className="size-3.5 animate-spin" />
          {progress}
        </p>
      ) : null}

      <div
        className="mt-5 rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-zinc-600"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const files = [...event.dataTransfer.files];
          const imageCount = files.filter((file) => file.type.startsWith("image/")).length;
          uploadTarget.current = { mode: "new", asGallery: imageCount > 1 };
          if (files.length) void uploadFiles(files);
        }}
      >
        把圖片或影片拖到這裡，或用「新增區塊」。可一次選多張。
      </div>

      <div className="mt-5 space-y-3">
        {blocks.length ? (
          blocks.map((block, index) => (
            <article key={block.clientId} className="rounded-2xl border border-white/[0.07] bg-black/20 p-3 sm:p-4">
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <span className="rounded-full bg-white/[0.04] px-2 py-1">
                  {articleBlockTypeLabels[block.type]}
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
                onSetCover={onSetCover}
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
              />
            </article>
          ))
        ) : (
          <p className="py-6 text-center text-sm text-zinc-600">還沒有內容區塊。</p>
        )}
      </div>
    </section>
  );
}

function BlockFields({
  block,
  onChange,
  onSetCover,
  onPickImages,
  onPickVideo,
  onPickPoster,
}: {
  block: EditorBlock;
  onChange: (patch: Partial<EditorBlock>) => void;
  onSetCover: (previewUrl: string) => void;
  onPickImages: () => void;
  onPickVideo: () => void;
  onPickPoster: () => void;
}) {
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
    return (
      <input
        value={String(block.metadata.url ?? block.mediaUrl ?? "")}
        onChange={(event) =>
          onChange({
            mediaUrl: event.target.value,
            metadata: { ...block.metadata, url: event.target.value },
          })
        }
        placeholder="YouTube / TikTok / Instagram / Threads 網址"
        className="editor-input mt-3 font-mono text-xs"
      />
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
          <video
            src={block.mediaUrl}
            poster={block.thumbnailUrl ?? undefined}
            controls
            preload="metadata"
            className="aspect-video w-full rounded-xl bg-black"
          />
        ) : (
          <button type="button" onClick={onPickVideo} className="grid aspect-video w-full place-items-center rounded-xl border border-dashed border-white/10 text-zinc-600">
            <Video className="size-5" />
          </button>
        )}
        <CaptionFields block={block} onChange={onChange} />
        {block.mediaUrl ? (
          <button type="button" className="text-xs text-[#d3b176]" onClick={onPickPoster}>
            {block.thumbnailUrl ? "更換影片封面" : "設定影片封面 poster"}
          </button>
        ) : null}
      </div>
    );
  }
  if (block.type === "image") {
    return (
      <div className="mt-3 space-y-3">
        {block.mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={block.mediaUrl} alt={block.altText} className="h-auto w-full rounded-xl object-cover" />
        ) : (
          <button type="button" onClick={onPickImages} className="grid aspect-video w-full place-items-center rounded-xl border border-dashed border-white/10 text-zinc-600">
            <ImagePlus className="size-5" />
          </button>
        )}
        <CaptionFields block={block} onChange={onChange} />
        {block.mediaUrl ? (
          <button type="button" className="text-xs text-[#d3b176]" onClick={() => onSetCover(block.mediaUrl!)}>
            設為封面
          </button>
        ) : null}
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
          <div key={`${item.url}-${index}`} className="rounded-xl border border-white/[0.06] p-2">
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
              value={item.source ?? ""}
              onChange={(event) => {
                const next = [...items];
                next[index] = { ...item, source: event.target.value };
                onChange({ metadata: { ...block.metadata, items: next } });
              }}
              placeholder="來源"
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
            <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
              <button
                type="button"
                className="text-[#d3b176]"
                onClick={() => onSetCover(item.url)}
              >
                設為封面
              </button>
              <button
                type="button"
                disabled={index === 0}
                className="disabled:opacity-30"
                onClick={() => {
                  const next = [...items];
                  const [moved] = next.splice(index, 1);
                  next.splice(index - 1, 0, moved);
                  onChange({ metadata: { ...block.metadata, items: next } });
                }}
              >
                左移
              </button>
              <button
                type="button"
                disabled={index === items.length - 1}
                className="disabled:opacity-30"
                onClick={() => {
                  const next = [...items];
                  const [moved] = next.splice(index, 1);
                  next.splice(index + 1, 0, moved);
                  onChange({ metadata: { ...block.metadata, items: next } });
                }}
              >
                右移
              </button>
              <button
                type="button"
                className="text-zinc-500"
                onClick={() => {
                  const next = items.filter((_, itemIndex) => itemIndex !== index);
                  onChange({ metadata: { ...block.metadata, items: next } });
                }}
              >
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="secondary" onClick={onPickImages}>
        <ImagePlus className="size-3.5" />
        再加圖片
      </Button>
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
        placeholder="圖片說明"
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
        placeholder="ALT"
        className="h-9 rounded-lg border border-white/10 bg-black/20 px-3 text-xs"
      />
    </div>
  );
}
