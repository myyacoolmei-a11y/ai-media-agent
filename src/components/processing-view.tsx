"use client";

import { AlertCircle, Check, LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { AnalysisProjectResponse } from "@/types/analysis";

const progressSteps = [
  "正在讀取你的素材",
  "正在整理內容重點",
  "正在產生三版文案",
  "正在規劃三版剪輯方向",
  "正在準備標題與標籤",
  "完成",
];

export function ProcessingView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [data, setData] = useState<AnalysisProjectResponse | null>(null);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as
          | AnalysisProjectResponse
          | { error?: string };
        if (!response.ok) {
          throw new Error("error" in payload ? payload.error : "無法讀取進度。");
        }
        if (cancelled) return;
        const project = payload as AnalysisProjectResponse;
        setData(project);
        setRequestError("");
        if (project.project.status === "completed") {
          router.replace(`/projects/${projectId}/results`);
        }
      } catch (error) {
        if (!cancelled) {
          setRequestError(
            error instanceof Error ? error.message : "無法讀取分析進度。",
          );
        }
      }
    }

    void poll();
    const interval = window.setInterval(poll, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [projectId, router]);

  const activeIndex = useMemo(() => {
    if (!data) return 0;
    if (data.project.status === "completed") return 5;
    const completed = new Set(
      data.tasks
        .filter((task) => task.status === "completed")
        .map((task) => task.type),
    );
    if (!completed.has("extract_audio")) return 0;
    if (!completed.has("transcribe")) return 1;
    if (!completed.has("generate_copy")) return 2;
    if (!completed.has("summarize")) return 3;
    return 4;
  }, [data]);

  const progress =
    activeIndex === 5 ? 100 : Math.max(8, Math.round(((activeIndex + 0.35) / 5) * 100));
  const failed = data?.project.status === "failed";

  return (
    <div className="mx-auto max-w-3xl py-4 sm:py-10">
      <div className="text-center">
        <span
          className={cn(
            "mx-auto mb-6 grid size-14 place-items-center rounded-2xl border",
            failed
              ? "border-red-300/25 bg-red-300/10 text-red-300"
              : "border-[#e2b8bd]/20 bg-[#e2b8bd]/10 text-[#e2b8bd]",
          )}
        >
          {failed ? <AlertCircle className="size-6" /> : <Sparkles className="size-6" />}
        </span>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">
          {failed ? "這次分析沒有完成" : "正在為你製作內容"}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-zinc-500">
          {failed
            ? data?.project.error || "請確認服務設定後重新上傳。"
            : "影片已安全儲存，現在正根據實際內容與你的需求進行分析。"}
        </p>
      </div>

      {requestError && (
        <div className="mt-8 rounded-2xl border border-red-300/20 bg-red-300/[0.06] p-4 text-sm text-red-200">
          {requestError}
        </div>
      )}

      <div className="relative mt-12 overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#100f10] p-6 sm:p-9">
        <div className="relative">
          <div className="mb-8 flex items-center justify-between">
            <span className="text-xs text-zinc-500">製作進度</span>
            <span className="text-xs font-medium text-[#e2b8bd]">
              {failed ? "已停止" : `${progress}%`}
            </span>
          </div>
          <div className="mb-9 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                failed
                  ? "bg-red-300/60"
                  : "bg-gradient-to-r from-[#b98e95] to-[#ebcbd0]",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          <ol className="space-y-1">
            {progressSteps.map((label, index) => {
              const done = index < activeIndex || activeIndex === 5;
              const active = index === activeIndex && !done && !failed;
              return (
                <li
                  key={label}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl px-3 py-3.5",
                    active && "bg-white/[0.035]",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full border",
                      done && "border-[#d2b078]/30 bg-[#d2b078]/10 text-[#d2b078]",
                      active && "border-[#e2b8bd]/35 bg-[#e2b8bd] text-black",
                      !done && !active && "border-white/[0.08] text-zinc-700",
                    )}
                  >
                    {done ? (
                      <Check className="size-3.5" />
                    ) : active ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      done && "text-zinc-300",
                      active && "font-medium text-white",
                      !done && !active && "text-zinc-700",
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
