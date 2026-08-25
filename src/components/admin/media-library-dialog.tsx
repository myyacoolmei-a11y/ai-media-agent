"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { MediaAsset } from "@/types/media";

export function MediaLibraryDialog({
  open,
  kind,
  onClose,
  onPick,
}: {
  open: boolean;
  kind: "image" | "video";
  onClose: () => void;
  onPick: (assets: MediaAsset[]) => void;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    void fetch("/api/media")
      .then(async (response) => {
        const body = (await response.json()) as { assets?: MediaAsset[]; error?: string };
        if (!response.ok) throw new Error(body.error || "無法讀取媒體庫。");
        setAssets((body.assets ?? []).filter((asset) => asset.type === kind));
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "無法讀取媒體庫。");
      });
  }, [kind, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-3xl overflow-auto rounded-3xl border border-white/10 bg-[#121012] p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-white">從媒體庫選擇</p>
            <p className="mt-1 text-[11px] text-zinc-500">可複選已上傳的{kind === "image" ? "圖片" : "影片"}，不必重複上傳。</p>
          </div>
          <button type="button" className="text-xs text-zinc-500" onClick={onClose}>
            關閉
          </button>
        </div>
        {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {assets.map((asset) => {
            const active = selected.includes(asset.id);
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() =>
                  setSelected((current) =>
                    active ? current.filter((id) => id !== asset.id) : [...current, asset.id],
                  )
                }
                className={`overflow-hidden rounded-2xl border ${active ? "border-[#d3b176]" : "border-white/10"}`}
              >
                {kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.signed_thumb_url || asset.signed_url}
                    alt={asset.alt_text || asset.filename}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="grid aspect-square place-items-center bg-black text-[11px] text-zinc-500">
                    {asset.filename}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {!assets.length ? (
          <p className="mt-6 text-center text-sm text-zinc-600">媒體庫還沒有可用素材。</p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!selected.length}
            onClick={() => {
              onPick(assets.filter((asset) => selected.includes(asset.id)));
              onClose();
            }}
          >
            插入已選
          </Button>
        </div>
      </div>
    </div>
  );
}
