"use client";

import {
  Captions,
  Film,
  LoaderCircle,
  Plus,
  Scissors,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ContentAsset, ContentItem } from "@/types/content";
import type { RenderSettings } from "@/types/render";

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function VideoProductionPanel({
  content,
  assets,
  onRendered,
}: {
  content: ContentItem;
  assets: ContentAsset[];
  onRendered: () => Promise<void>;
}) {
  const videos = assets.filter((asset) => asset.asset_type === "video");
  const stored = content.production_data ?? {};
  const [sourceAssetId, setSourceAssetId] = useState<string>(
    typeof stored.sourceAssetId === "string"
      ? stored.sourceAssetId
      : videos[0]?.id ?? "",
  );
  const [clips, setClips] = useState<RenderSettings["clips"]>(
    Array.isArray(stored.clips)
      ? (stored.clips as RenderSettings["clips"])
      : [{ id: createId("clip"), startSeconds: 0, endSeconds: 10 }],
  );
  const [subtitles, setSubtitles] = useState<RenderSettings["subtitles"]>(
    Array.isArray(stored.subtitles)
      ? (stored.subtitles as RenderSettings["subtitles"])
      : [],
  );
  const [burnSubtitles, setBurnSubtitles] = useState(
    stored.burnSubtitles !== false,
  );
  const [subtitleStyle, setSubtitleStyle] = useState(
    typeof stored.subtitleStyle === "string"
      ? stored.subtitleStyle
      : "白色底部字幕",
  );
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [outputUrl, setOutputUrl] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const source = videos.find((asset) => asset.id === sourceAssetId);

  useEffect(() => {
    if (!busy.startsWith("poll-")) return;
    const interval = window.setInterval(async () => {
      if (busy === "poll-render") {
        const response = await fetch(`/api/contents/${content.id}/render`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          renderJob?: { status: string; error?: string };
          outputUrl?: string;
        };
        if (payload.renderJob?.status === "completed" && payload.outputUrl) {
          setOutputUrl(payload.outputUrl);
          setBusy("");
          await onRendered();
        } else if (payload.renderJob?.status === "failed") {
          setError(payload.renderJob.error || "影片渲染失敗。");
          setBusy("");
        }
      } else {
        const response = await fetch(`/api/contents/${content.id}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          content?: ContentItem;
        };
        const nextSubtitles = payload.content?.production_data?.subtitles;
        if (Array.isArray(nextSubtitles) && nextSubtitles.length) {
          setSubtitles(nextSubtitles as RenderSettings["subtitles"]);
          setBusy("");
        }
      }
    }, 2500);
    return () => window.clearInterval(interval);
  }, [busy, content.id, onRendered]);

  function setClipTime(
    index: number,
    field: "startSeconds" | "endSeconds",
    value: number,
  ) {
    setClips((current) =>
      current.map((clip, clipIndex) =>
        clipIndex === index ? { ...clip, [field]: value } : clip,
      ),
    );
  }

  async function transcribe() {
    if (!sourceAssetId) {
      setError("請先上傳並選擇來源影片。");
      return;
    }
    if (
      !window.confirm(
        "自動語音轉字幕會呼叫付費語音辨識 API。確定要執行嗎？",
      )
    ) {
      return;
    }
    setBusy("transcribe");
    setError("");
    const response = await fetch(
      `/api/contents/${content.id}/ai/transcribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceAssetId }),
      },
    );
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error || "語音辨識無法啟動。");
      setBusy("");
      return;
    }
    setBusy("poll-transcription");
  }

  async function render() {
    if (!sourceAssetId) {
      setError("請先選擇來源影片。");
      return;
    }
    setBusy("render");
    setError("");
    const response = await fetch(`/api/contents/${content.id}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceAssetId,
        clips,
        subtitles,
        burnSubtitles,
        subtitleStyle,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error || "影片渲染無法啟動。");
      setBusy("");
      return;
    }
    setBusy("poll-render");
  }

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex items-start gap-3">
        <Film className="mt-0.5 size-4 text-[#d3b176]" />
        <div>
          <h2 className="text-sm font-medium">影片手動製作</h2>
          <p className="mt-1 text-xs leading-5 text-zinc-600">
            裁切、合併與字幕燒錄使用 FFmpeg，不會呼叫生成式影片 API。
          </p>
        </div>
      </div>

      {!videos.length ? (
        <p className="mt-5 rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-zinc-600">
          請先在下方媒體區上傳影片。
        </p>
      ) : (
        <>
          <label className="mt-5 block">
            <span className="mb-2 block text-[11px] text-zinc-600">來源影片</span>
            <select
              value={sourceAssetId}
              onChange={(event) => setSourceAssetId(event.target.value)}
              className="setting-input"
            >
              {videos.map((video) => (
                <option key={video.id} value={video.id}>
                  {video.file_name}
                </option>
              ))}
            </select>
          </label>
          {source?.signed_url && (
            <video
              ref={videoRef}
              src={source.signed_url}
              controls
              preload="metadata"
              className="mt-4 aspect-video w-full rounded-2xl bg-black"
            />
          )}

          <div className="mt-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs text-zinc-300">
              <Scissors className="size-3.5" />
              保留片段
            </h3>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                setClips((current) => [
                  ...current,
                  { id: createId("clip"), startSeconds: 0, endSeconds: 10 },
                ])
              }
            >
              <Plus className="size-3.5" />
              新增片段
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {clips.map((clip, index) => (
              <div
                key={clip.id}
                className="grid gap-2 rounded-2xl border border-white/[0.06] p-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <TimeInput
                  label="開始秒數"
                  value={clip.startSeconds}
                  onChange={(value) => setClipTime(index, "startSeconds", value)}
                  onUseCurrent={() =>
                    setClipTime(
                      index,
                      "startSeconds",
                      videoRef.current?.currentTime ?? 0,
                    )
                  }
                />
                <TimeInput
                  label="結束秒數"
                  value={clip.endSeconds}
                  onChange={(value) => setClipTime(index, "endSeconds", value)}
                  onUseCurrent={() =>
                    setClipTime(
                      index,
                      "endSeconds",
                      videoRef.current?.currentTime ?? 0,
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setClips((current) =>
                      current.filter((item) => item.id !== clip.id),
                    )
                  }
                  className="grid size-9 place-items-center self-end rounded-xl text-red-300/50 hover:bg-red-300/10 hover:text-red-300"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-xs text-zinc-300">
              <Captions className="size-3.5" />
              字幕
            </h3>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy !== ""}
                onClick={transcribe}
              >
                {busy === "transcribe" || busy === "poll-transcription" ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                選配：自動語音轉字幕
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setSubtitles((current) => [
                    ...current,
                    {
                      id: createId("subtitle"),
                      startSeconds: 0,
                      endSeconds: 3,
                      text: "",
                    },
                  ])
                }
              >
                <Plus className="size-3.5" />
                手動新增
              </Button>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {subtitles.map((subtitle, index) => (
              <div
                key={subtitle.id}
                className="grid gap-2 rounded-2xl border border-white/[0.06] p-3 sm:grid-cols-[90px_90px_1fr_auto]"
              >
                <input
                  type="number"
                  step="0.1"
                  value={subtitle.startSeconds}
                  onChange={(event) =>
                    setSubtitles((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, startSeconds: Number(event.target.value) }
                          : item,
                      ),
                    )
                  }
                  className="setting-input"
                />
                <input
                  type="number"
                  step="0.1"
                  value={subtitle.endSeconds}
                  onChange={(event) =>
                    setSubtitles((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, endSeconds: Number(event.target.value) }
                          : item,
                      ),
                    )
                  }
                  className="setting-input"
                />
                <input
                  value={subtitle.text}
                  onChange={(event) =>
                    setSubtitles((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, text: event.target.value }
                          : item,
                      ),
                    )
                  }
                  placeholder="字幕文字"
                  className="setting-input"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSubtitles((current) =>
                      current.filter((item) => item.id !== subtitle.id),
                    )
                  }
                  className="grid size-9 place-items-center rounded-xl text-red-300/50 hover:text-red-300"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label>
              <span className="mb-2 block text-[11px] text-zinc-600">
                字幕樣式
              </span>
              <input
                value={subtitleStyle}
                onChange={(event) => setSubtitleStyle(event.target.value)}
                className="setting-input"
              />
            </label>
            <label className="flex h-11 items-center gap-2 text-xs text-zinc-500">
              <input
                type="checkbox"
                checked={burnSubtitles}
                onChange={(event) => setBurnSubtitles(event.target.checked)}
              />
              將字幕加入影片
            </label>
          </div>

          {error && <p className="mt-4 text-xs text-red-300">{error}</p>}
          <Button
            type="button"
            className="mt-5 w-full"
            disabled={busy !== ""}
            onClick={render}
          >
            {busy.includes("render") ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Film className="size-4" />
            )}
            {busy.includes("render") ? "FFmpeg 處理中…" : "使用 FFmpeg 建立預覽影片"}
          </Button>
          {outputUrl && (
            <video
              src={outputUrl}
              controls
              className="mt-5 aspect-video w-full rounded-2xl bg-black"
            />
          )}
        </>
      )}
    </section>
  );
}

function TimeInput({
  label,
  value,
  onChange,
  onUseCurrent,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onUseCurrent: () => void;
}) {
  return (
    <label>
      <span className="mb-1 flex items-center justify-between text-[10px] text-zinc-600">
        {label}
        <button type="button" onClick={onUseCurrent} className="text-[#d3b176]">
          使用目前時間
        </button>
      </span>
      <input
        type="number"
        min={0}
        step="0.1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="setting-input"
      />
    </label>
  );
}
