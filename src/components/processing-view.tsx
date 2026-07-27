"use client";

import { FileVideo2, Pause, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { WorkflowRail } from "@/components/workflow-rail";
import { DEMO_PROJECT_ID, mockMedia } from "@/lib/mock-data";
import { formatDuration, formatFileSize } from "@/lib/utils";

export function ProcessingView() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(1);
  const progress = Math.round(((activeIndex + 0.45) / 7) * 100);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= 6) {
          window.clearInterval(interval);
          window.setTimeout(
            () => router.push(`/projects/${DEMO_PROJECT_ID}/results`),
            700,
          );
          return current;
        }

        return current + 1;
      });
    }, 650);

    return () => window.clearInterval(interval);
  }, [router]);

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
      <section>
        <div className="mb-10 flex items-start justify-between gap-6">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/[0.06] px-3 py-1.5 text-[11px] font-medium text-lime-300">
              <Sparkles className="size-3" />
              AI 正在工作
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              正在理解你的內容
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
              你可以離開此頁，分析會在背景持續進行。這個畫面使用 Mock
              Pipeline 展示完整流程。
            </p>
          </div>
          <Button variant="secondary" size="sm" type="button">
            <Pause className="size-3.5" />
            暫停
          </Button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025]">
          <div className="flex items-center gap-4 border-b border-white/[0.07] p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/[0.05]">
              <FileVideo2 className="size-5 text-zinc-300" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">
                {mockMedia.fileName}
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                {formatDuration(mockMedia.durationSeconds ?? 0)} ·{" "}
                {formatFileSize(mockMedia.sizeBytes)}
              </p>
            </div>
            <span className="font-mono text-xs text-lime-300">{progress}%</span>
          </div>
          <div className="h-1 bg-white/[0.04]">
            <div
              className="h-full bg-lime-300 shadow-[0_0_18px_rgba(190,242,100,0.5)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="p-6 sm:p-8">
            <WorkflowRail activeIndex={activeIndex} orientation="vertical" />
          </div>
        </div>
      </section>

      <aside className="lg:pt-32">
        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.02] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
            Live signal
          </p>
          <div className="mt-6 aspect-video overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_65%_35%,rgba(190,242,100,0.16),transparent_35%),linear-gradient(145deg,#151515,#080808)]">
            <div className="flex h-full items-end p-4">
              <div className="flex h-10 w-full items-end gap-1 opacity-70">
                {[30, 55, 80, 45, 68, 90, 35, 62, 76, 42, 88, 54].map(
                  (height, index) => (
                    <span
                      key={index}
                      className="flex-1 animate-pulse rounded-full bg-lime-300/70"
                      style={{
                        height: `${height}%`,
                        animationDelay: `${index * 70}ms`,
                      }}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
          <p className="mt-5 text-sm font-medium text-zinc-300">
            語音與畫面訊號正常
          </p>
          <p className="mt-2 text-xs leading-5 text-zinc-600">
            Pipeline 完成後會自動前往內容結果。
          </p>
        </div>
      </aside>
    </div>
  );
}
