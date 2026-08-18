"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatStoryDateTime } from "@/lib/content/dates";
import {
  SOCIAL_PLATFORMS,
  socialConnectionStateLabels,
  socialPlatformLabels,
  socialStatusLabels,
} from "@/lib/social/platforms";
import { cn } from "@/lib/utils";
import type {
  SocialConnection,
  SocialPlatform,
  SocialPublication,
} from "@/types/social";

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
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (platform) params.set("platform", platform);
    if (status) params.set("status", status);
    const [listResponse, statusResponse] = await Promise.all([
      fetch(`/api/social/publications?${params.toString()}`),
      fetch("/api/social/status"),
    ]);
    const body = (await listResponse.json()) as {
      publications?: SocialPublication[];
      error?: string;
    };
    if (!listResponse.ok) throw new Error(body.error || "無法載入社群紀錄。");
    setRows(body.publications ?? []);
    const statusBody = (await statusResponse.json()) as {
      connections?: SocialConnection[];
    };
    setConnections(statusBody.connections ?? []);
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
      {connections.length ? (
        <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {connections.map((item) => (
            <div
              key={item.platform}
              className="rounded-2xl border border-white/10 p-4"
            >
              <p className="text-sm text-white">{item.label}</p>
              <p className="mt-2 text-[10px] text-zinc-500">已串官方 API</p>
              <p
                className={cn(
                  "mt-2 text-xs",
                  item.connected ? "text-emerald-300" : "text-zinc-400",
                )}
              >
                {socialConnectionStateLabels[item.state]}
              </p>
              {item.missingEnv.length ? (
                <p className="mt-2 text-[11px] leading-5 text-zinc-600">
                  {item.missingEnv.join("、")}
                </p>
              ) : item.reason ? (
                <p className="mt-2 text-[11px] leading-5 text-zinc-600">
                  {item.reason}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

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
        <div className="hidden border-b border-white/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.16em] text-zinc-600 lg:grid lg:grid-cols-[1.4fr_90px_90px_140px_1fr_auto]">
          <span>報導</span>
          <span>平台</span>
          <span>發布狀態</span>
          <span>發布時間</span>
          <span>外部連結 / 錯誤訊息</span>
          <span>重新發布</span>
        </div>
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
                disabled={Boolean(busy) || row.status === "publishing"}
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
            還沒有社群發布紀錄。先在內容編輯器產生文案，再對單一平台按發布。
          </p>
        )}
      </div>
    </div>
  );
}
