"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatStoryDateTime } from "@/lib/content/dates";
import {
  SOCIAL_PLATFORMS,
  socialPlatformLabels,
  socialStatusLabels,
} from "@/lib/social/platforms";
import { cn } from "@/lib/utils";
import type { SocialPlatform, SocialPublication } from "@/types/social";

const statusFilters = [
  { value: "", label: "全部狀態" },
  { value: "success", label: "成功" },
  { value: "failed", label: "失敗" },
  { value: "pending", label: "待發布" },
];

export function SocialStatusBoard() {
  const [platform, setPlatform] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<SocialPublication[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (platform) params.set("platform", platform);
    if (status) params.set("status", status);
    const response = await fetch(`/api/social/publications?${params.toString()}`);
    const body = (await response.json()) as {
      publications?: SocialPublication[];
      error?: string;
    };
    if (!response.ok) throw new Error(body.error || "無法載入社群紀錄。");
    setRows(body.publications ?? []);
  }, [platform, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "無法載入社群紀錄。");
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function retry(id: string) {
    setBusy(id);
    setError("");
    try {
      const response = await fetch(`/api/social/publications/${id}/publish`, {
        method: "POST",
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || "重新發布失敗。");
      await load();
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "重新發布失敗。");
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <select
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
            className="h-10 rounded-full border border-white/10 bg-black/20 px-3 text-xs text-white"
          >
            <option value="">全部平台</option>
            {SOCIAL_PLATFORMS.map((item) => (
              <option key={item} value={item}>
                {socialPlatformLabels[item]}
              </option>
            ))}
          </select>
          {statusFilters.map((item) => (
            <button
              key={item.value || "all"}
              type="button"
              onClick={() => setStatus(item.value)}
              className={cn(
                "h-10 rounded-full border px-4 text-xs",
                status === item.value
                  ? "border-[#d3b176]/40 text-white"
                  : "border-white/10 text-zinc-500",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-5 rounded-xl bg-red-300/[0.07] p-3 text-xs text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-3xl border border-white/[0.08]">
        {rows.length ? (
          rows.map((row) => (
            <div
              key={row.id}
              className="grid gap-3 border-b border-white/[0.06] p-5 last:border-0 lg:grid-cols-[1.4fr_90px_90px_140px_1fr_auto] lg:items-start"
            >
              <div>
                <Link
                  href={`/admin/content/${row.content_item_id}/edit`}
                  className="text-sm text-white hover:text-[#e2b8bd]"
                >
                  {row.content_title || "未命名報導"}
                </Link>
                <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-zinc-600">
                  {row.social_text || "尚未產生文案"}
                </p>
              </div>
              <p className="text-xs text-zinc-400">
                {socialPlatformLabels[row.platform as SocialPlatform]}
              </p>
              <p
                className={
                  row.status === "published"
                    ? "text-xs text-emerald-300"
                    : row.status === "failed"
                      ? "text-xs text-red-200"
                      : "text-xs text-zinc-500"
                }
              >
                {socialStatusLabels[row.status]}
              </p>
              <p className="text-xs text-zinc-600">
                {row.published_at
                  ? formatStoryDateTime(row.published_at)
                  : formatStoryDateTime(row.updated_at)}
              </p>
              <div className="text-[11px] leading-5 text-zinc-500">
                {row.external_url ? (
                  <a
                    href={row.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#d3b176]"
                  >
                    外部連結
                  </a>
                ) : (
                  <span>沒有外部連結</span>
                )}
                {row.error_message ? (
                  <p className="mt-1 text-red-200">{row.error_message}</p>
                ) : null}
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={Boolean(busy) || row.status === "published"}
                onClick={() => void retry(row.id)}
              >
                {busy === row.id ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                重新發布
              </Button>
            </div>
          ))
        ) : (
          <p className="p-10 text-center text-sm text-zinc-600">
            還沒有社群發布紀錄。先在內容編輯器勾選平台並產生文案。
          </p>
        )}
      </div>
    </div>
  );
}
