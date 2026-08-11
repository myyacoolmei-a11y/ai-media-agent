"use client";

import { ImageIcon, LoaderCircle, Wand2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { ContentAsset, ContentItem } from "@/types/content";

const ratios = {
  "1:1": 1,
  "4:5": 4 / 5,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
} as const;

export function ImageProductionPanel({
  content,
  assets,
  onCreated,
}: {
  content: ContentItem;
  assets: ContentAsset[];
  onCreated: () => Promise<void>;
}) {
  const images = assets.filter((asset) => asset.asset_type === "image");
  const stored = content.production_data ?? {};
  const [sourceId, setSourceId] = useState(images[0]?.id ?? "");
  const [ratio, setRatio] = useState<keyof typeof ratios>(
    (stored.ratio as keyof typeof ratios) || "1:1",
  );
  const [width, setWidth] = useState(
    typeof stored.width === "number" ? stored.width : 1080,
  );
  const [template, setTemplate] = useState(
    typeof stored.template === "string" ? stored.template : "none",
  );
  const [positionX, setPositionX] = useState(
    typeof stored.objectPositionX === "number" ? stored.objectPositionX : 50,
  );
  const [positionY, setPositionY] = useState(
    typeof stored.objectPositionY === "number" ? stored.objectPositionY : 50,
  );
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [error, setError] = useState("");
  const source = images.find((asset) => asset.id === sourceId);
  const height = Math.round(width / ratios[ratio]);

  async function createVariant() {
    if (!source?.signed_url) {
      setError("請先上傳並選擇圖片。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(source.signed_url);
      const bitmap = await createImageBitmap(await response.blob());
      const targetRatio = ratios[ratio];
      const sourceRatio = bitmap.width / bitmap.height;
      let sourceWidth = bitmap.width;
      let sourceHeight = bitmap.height;
      if (sourceRatio > targetRatio) sourceWidth = bitmap.height * targetRatio;
      else sourceHeight = bitmap.width / targetRatio;
      const maxX = bitmap.width - sourceWidth;
      const maxY = bitmap.height - sourceHeight;
      const sourceX = maxX * (positionX / 100);
      const sourceY = maxY * (positionY / 100);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("瀏覽器無法處理圖片。");
      context.drawImage(
        bitmap,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        width,
        height,
      );
      if (template !== "none") {
        context.strokeStyle =
          template === "editorial"
            ? "rgba(210,177,118,.9)"
            : "rgba(255,255,255,.85)";
        context.lineWidth = Math.max(4, width * 0.012);
        context.strokeRect(
          context.lineWidth / 2,
          context.lineWidth / 2,
          width - context.lineWidth,
          height - context.lineWidth,
        );
        if (template === "brand") {
          context.fillStyle = "rgba(10,9,10,.72)";
          context.fillRect(0, height * 0.86, width, height * 0.14);
        }
      }
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error("圖片輸出失敗。"))),
          "image/webp",
          0.9,
        ),
      );
      const fileName = `edited-${Date.now()}.webp`;
      const prepareResponse = await fetch(
        `/api/contents/${content.id}/assets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName,
            mimeType: "image/webp",
            sizeBytes: blob.size,
            assetType: "image",
          }),
        },
      );
      const prepared = (await prepareResponse.json()) as {
        asset?: ContentAsset;
        upload?: { path: string; token: string };
        error?: string;
      };
      if (!prepareResponse.ok || !prepared.asset || !prepared.upload) {
        throw new Error(prepared.error || "無法準備圖片上傳。");
      }
      const { error: uploadError } = await createClient().storage
        .from("content-media")
        .uploadToSignedUrl(
          prepared.upload.path,
          prepared.upload.token,
          blob,
          { contentType: "image/webp" },
        );
      if (uploadError) throw uploadError;
      await fetch(
        `/api/contents/${content.id}/assets/${prepared.asset.id}/complete`,
        { method: "POST" },
      );
      await fetch(
        `/api/contents/${content.id}/assets/${prepared.asset.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            altText: source.alt_text,
            sortOrder: images.length,
            transformSettings: {
              ratio,
              width,
              height,
              template,
              objectPositionX: positionX,
              objectPositionY: positionY,
              processedLocally: true,
            },
          }),
        },
      );
      await onCreated();
    } catch (processingError) {
      setError(
        processingError instanceof Error
          ? processingError.message
          : "圖片處理失敗。",
      );
    } finally {
      setBusy(false);
    }
  }

  async function runAiEdit() {
    if (!sourceId || aiPrompt.trim().length < 5) {
      setError("請選擇來源圖片並描述 AI 修圖需求。");
      return;
    }
    if (
      !window.confirm(
        "AI 修圖是選配付費功能。確定要送出目前圖片並呼叫 AI 嗎？",
      )
    ) {
      return;
    }
    setAiBusy(true);
    setError("");
    const response = await fetch(`/api/contents/${content.id}/ai/image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceAssetId: sourceId, prompt: aiPrompt }),
    });
    const payload = (await response.json()) as { error?: string };
    setAiBusy(false);
    if (!response.ok) {
      setError(payload.error || "AI 修圖失敗。");
      return;
    }
    setAiPrompt("");
    await onCreated();
  }

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex items-start gap-3">
        <ImageIcon className="mt-0.5 size-4 text-[#d3b176]" />
        <div>
          <h2 className="text-sm font-medium">圖片版型工具</h2>
          <p className="mt-1 text-xs leading-5 text-zinc-600">
            裁切、比例、尺寸與版型都在瀏覽器處理，不會呼叫 AI API。
          </p>
        </div>
      </div>
      {!images.length ? (
        <p className="mt-5 rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-zinc-600">
          請先在下方媒體區上傳一張或多張圖片。
        </p>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
          <div
            className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl bg-black"
            style={{ aspectRatio: ratio.replace(":", " / ") }}
          >
            {source?.signed_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={source.signed_url}
                alt={source.alt_text || source.file_name}
                className="size-full object-cover"
                style={{ objectPosition: `${positionX}% ${positionY}%` }}
              />
            )}
          </div>
          <div className="space-y-4">
            <label>
              <span className="setting-label">來源圖片</span>
              <select
                value={sourceId}
                onChange={(event) => setSourceId(event.target.value)}
                className="setting-input"
              >
                {images.map((image) => (
                  <option key={image.id} value={image.id}>
                    {image.file_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="setting-label">比例</span>
              <select
                value={ratio}
                onChange={(event) =>
                  setRatio(event.target.value as keyof typeof ratios)
                }
                className="setting-input"
              >
                {Object.keys(ratios).map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="setting-label">輸出寬度（px）</span>
              <input
                type="number"
                min={320}
                max={4096}
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
                className="setting-input"
              />
              <span className="mt-1 block text-[10px] text-zinc-700">
                輸出尺寸：{width} × {height}
              </span>
            </label>
            <label>
              <span className="setting-label">水平裁切位置</span>
              <input
                type="range"
                min={0}
                max={100}
                value={positionX}
                onChange={(event) => setPositionX(Number(event.target.value))}
                className="w-full"
              />
            </label>
            <label>
              <span className="setting-label">垂直裁切位置</span>
              <input
                type="range"
                min={0}
                max={100}
                value={positionY}
                onChange={(event) => setPositionY(Number(event.target.value))}
                className="w-full"
              />
            </label>
            <label>
              <span className="setting-label">品牌版型</span>
              <select
                value={template}
                onChange={(event) => setTemplate(event.target.value)}
                className="setting-input"
              >
                <option value="none">無</option>
                <option value="clean">簡潔白框</option>
                <option value="editorial">編輯金框</option>
                <option value="brand">品牌底欄</option>
              </select>
            </label>
            <Button
              type="button"
              className="w-full"
              disabled={busy}
              onClick={createVariant}
            >
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              套用並建立新圖片
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-4 text-xs text-red-300">{error}</p>}
      <div className="mt-5 rounded-2xl border border-[#d3b176]/15 bg-[#d3b176]/[0.03] p-4">
        <p className="text-xs text-zinc-400">選配：AI 修圖</p>
        <p className="mt-1 text-[11px] leading-5 text-zinc-700">
          只有主動點擊才會呼叫付費生成式影像 API。
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={aiPrompt}
            onChange={(event) => setAiPrompt(event.target.value)}
            placeholder="例如：調整自然光與白平衡，保留人物與商品"
            className="setting-input flex-1"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={aiBusy}
            onClick={runAiEdit}
          >
            {aiBusy ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Wand2 className="size-3.5" />
            )}
            主動執行 AI 修圖
          </Button>
        </div>
      </div>
    </section>
  );
}
