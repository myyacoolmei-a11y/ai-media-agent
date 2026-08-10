"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Eye,
  FileImage,
  FileVideo2,
  LoaderCircle,
  Save,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn, formatFileSize } from "@/lib/utils";
import {
  contentStatusLabels,
  contentTypeLabels,
  type ContentAsset,
  type ContentItem,
  type ContentStatus,
  type ContentType,
} from "@/types/content";
import type { BrandStyleProfile } from "@/types/style";

export function ContentEditor({
  initialContent,
  styles,
}: {
  initialContent: ContentItem;
  styles: BrandStyleProfile[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState(initialContent);
  const [assets, setAssets] = useState<ContentAsset[]>(
    initialContent.assets ?? [],
  );
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy("save");
    setError("");
    const response = await fetch(`/api/contents/${content.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: content.title,
        slug: content.slug,
        summary: content.summary,
        content: content.content,
        category: content.category,
        contentType: content.content_type,
        styleProfileId: content.style_profile_id,
        coverAssetId: content.cover_asset_id,
      }),
    });
    const payload = (await response.json()) as {
      content?: ContentItem;
      error?: string;
    };
    setBusy("");
    if (!response.ok || !payload.content) {
      setError(payload.error || "內容儲存失敗。");
      return false;
    }
    setContent((current) => ({ ...current, ...payload.content }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
    return true;
  }

  async function changeStatus(status: Exclude<ContentStatus, "archived">) {
    const didSave = await save();
    if (!didSave) return;
    setBusy(status);
    const response = await fetch(`/api/contents/${content.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = (await response.json()) as {
      content?: ContentItem;
      error?: string;
    };
    setBusy("");
    if (!response.ok || !payload.content) {
      setError(payload.error || "狀態更新失敗。");
      return;
    }
    setContent((current) => ({ ...current, ...payload.content }));
    if (status === "preview") {
      router.push(`/dashboard/contents/${content.id}/preview`);
    } else {
      router.refresh();
    }
  }

  async function reloadAssets() {
    const response = await fetch(`/api/contents/${content.id}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as { content?: ContentItem };
    if (payload.content) {
      setContent(payload.content);
      setAssets(payload.content.assets ?? []);
    }
  }

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    setBusy("upload");
    setError("");
    try {
      for (const file of files) {
        const assetType = file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : null;
        if (!assetType) throw new Error(`不支援 ${file.name} 的檔案格式。`);

        const prepareResponse = await fetch(
          `/api/contents/${content.id}/assets`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              mimeType: file.type,
              sizeBytes: file.size,
              assetType,
            }),
          },
        );
        const prepared = (await prepareResponse.json()) as {
          asset?: ContentAsset;
          upload?: { path: string; token: string };
          error?: string;
        };
        if (!prepareResponse.ok || !prepared.asset || !prepared.upload) {
          throw new Error(prepared.error || "無法準備媒體上傳。");
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

        const completeResponse = await fetch(
          `/api/contents/${content.id}/assets/${prepared.asset.id}/complete`,
          { method: "POST" },
        );
        const completed = (await completeResponse.json()) as { error?: string };
        if (!completeResponse.ok) {
          throw new Error(completed.error || "媒體驗證失敗。");
        }
      }
      await reloadAssets();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "媒體上傳失敗。",
      );
    } finally {
      setBusy("");
    }
  }

  async function removeAsset(asset: ContentAsset) {
    if (!window.confirm(`確定移除 ${asset.file_name}？`)) return;
    const response = await fetch(
      `/api/contents/${content.id}/assets/${asset.id}`,
      { method: "DELETE" },
    );
    if (response.ok) {
      if (content.cover_asset_id === asset.id) {
        setContent((current) => ({ ...current, cover_asset_id: null }));
      }
      await reloadAssets();
    }
  }

  async function moveAsset(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (!assets[index] || !assets[target]) return;
    const reordered = [...assets];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];
    setAssets(reordered);
    await Promise.all(
      reordered.map((asset, sortOrder) =>
        fetch(`/api/contents/${content.id}/assets/${asset.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ altText: asset.alt_text, sortOrder }),
        }),
      ),
    );
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/contents"
            className="grid size-9 place-items-center rounded-full border border-white/[0.08] text-zinc-600 hover:text-white"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <p className="text-[10px] text-zinc-600">
              {contentTypeLabels[content.content_type]} ·{" "}
              {contentStatusLabels[content.status]}
            </p>
            <h1 className="mt-1 text-lg font-medium">
              {content.title || "未命名內容"}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
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
            {saved ? "已儲存" : "儲存"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={Boolean(busy)}
            onClick={() => changeStatus("preview")}
          >
            <Eye className="size-3.5" />
            預覽
          </Button>
          <Button
            size="sm"
            disabled={Boolean(busy)}
            onClick={() => changeStatus("published")}
          >
            <Send className="size-3.5" />
            發布
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-5 rounded-xl bg-red-300/[0.07] p-3 text-xs text-red-200">
          {error}
        </p>
      )}

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          <EditorField label="標題">
            <input
              value={content.title}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="輸入內容標題"
              className="editor-input text-lg"
            />
          </EditorField>
          <EditorField label="摘要">
            <textarea
              value={content.summary}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  summary: event.target.value,
                }))
              }
              rows={4}
              placeholder="用幾句話說明內容重點"
              className="editor-input resize-y"
            />
          </EditorField>
          <EditorField label="完整內容">
            <textarea
              value={content.content}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  content: event.target.value,
                }))
              }
              rows={20}
              placeholder="輸入文章、影片說明或圖文內容。支援純文字與 Markdown。"
              className="editor-input min-h-96 resize-y font-mono text-sm leading-7"
            />
          </EditorField>

          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium">圖片與影片</h2>
                <p className="mt-1 text-xs text-zinc-600">
                  圖文可上傳多張圖片，影片內容可直接加入原始影片。
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                className="sr-only"
                onChange={(event) =>
                  uploadFiles(Array.from(event.target.files ?? []))
                }
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy === "upload"}
                onClick={() => inputRef.current?.click()}
              >
                {busy === "upload" ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                上傳媒體
              </Button>
            </div>

            {assets.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {assets.map((asset, index) => (
                  <div
                    key={asset.id}
                    className={cn(
                      "overflow-hidden rounded-2xl border bg-black/20",
                      content.cover_asset_id === asset.id
                        ? "border-[#deb5bb]/40"
                        : "border-white/[0.07]",
                    )}
                  >
                    <div className="aspect-video bg-black">
                      {asset.asset_type === "image" ? (
                        // Signed Supabase URL is dynamic and cannot be preconfigured for next/image.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.signed_url}
                          alt={asset.alt_text || asset.file_name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <video
                          src={asset.signed_url}
                          className="size-full object-contain"
                          controls
                          preload="metadata"
                        />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-xs text-zinc-300">
                        {asset.file_name}
                      </p>
                      <p className="mt-1 text-[10px] text-zinc-700">
                        {formatFileSize(asset.size_bytes)}
                      </p>
                      <div className="mt-3 flex items-center gap-1">
                        {asset.asset_type === "image" && (
                          <button
                            type="button"
                            onClick={() =>
                              setContent((current) => ({
                                ...current,
                                cover_asset_id: asset.id,
                              }))
                            }
                            className="mr-auto text-[10px] text-zinc-500 hover:text-[#e2b8bd]"
                          >
                            {content.cover_asset_id === asset.id
                              ? "目前封面"
                              : "設為封面"}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveAsset(index, -1)}
                          className="grid size-7 place-items-center rounded-lg text-zinc-600 hover:bg-white/5 hover:text-white disabled:opacity-20"
                        >
                          <ArrowUp className="size-3" />
                        </button>
                        <button
                          type="button"
                          disabled={index === assets.length - 1}
                          onClick={() => moveAsset(index, 1)}
                          className="grid size-7 place-items-center rounded-lg text-zinc-600 hover:bg-white/5 hover:text-white disabled:opacity-20"
                        >
                          <ArrowDown className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAsset(asset)}
                          className="grid size-7 place-items-center rounded-lg text-red-300/50 hover:bg-red-300/10 hover:text-red-300"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-5 flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-zinc-600 hover:border-white/20 hover:text-zinc-300"
              >
                {content.content_type === "image" ? (
                  <FileImage className="size-5" />
                ) : (
                  <FileVideo2 className="size-5" />
                )}
                <span className="mt-3 text-xs">加入圖片或影片</span>
              </button>
            )}
          </section>
        </section>

        <aside className="space-y-5">
          <SettingsCard title="發布設定">
            <label className="block">
              <span className="setting-label">網址代稱</span>
              <input
                value={content.slug}
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    slug: event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-")
                      .replace(/-+/g, "-")
                      .replace(/^-|-$/g, ""),
                  }))
                }
                className="setting-input"
              />
            </label>
            <label className="mt-4 block">
              <span className="setting-label">分類</span>
              <input
                value={content.category}
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                className="setting-input"
              />
            </label>
            <label className="mt-4 block">
              <span className="setting-label">內容類型</span>
              <select
                value={content.content_type}
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    content_type: event.target.value as ContentType,
                  }))
                }
                className="setting-input"
              >
                {Object.entries(contentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </SettingsCard>

          <SettingsCard title="品牌風格">
            <select
              value={content.style_profile_id ?? ""}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  style_profile_id: event.target.value || null,
                }))
              }
              className="setting-input"
            >
              <option value="">不指定</option>
              {styles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.style_name}
                </option>
              ))}
            </select>
            <p className="mt-3 text-[11px] leading-5 text-zinc-700">
              後續使用 AI 整理文字時，會優先套用這套品牌風格。
            </p>
          </SettingsCard>

          {content.status === "published" && (
            <SettingsCard title="發布資訊">
              <p className="text-xs text-emerald-300">已公開發布</p>
              <p className="mt-2 text-[11px] text-zinc-700">
                {content.published_at
                  ? new Date(content.published_at).toLocaleString("zh-TW")
                  : ""}
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-4 w-full"
                onClick={() => changeStatus("draft")}
              >
                取消發布並轉為草稿
              </Button>
            </SettingsCard>
          )}
        </aside>
      </div>
    </div>
  );
}

function EditorField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
      <h2 className="mb-4 text-sm font-medium">{title}</h2>
      {children}
    </section>
  );
}
