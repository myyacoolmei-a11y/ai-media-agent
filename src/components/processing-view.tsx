"use client";

import { Check, LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DEMO_PROJECT_ID } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const progressSteps = [
  "正在讀取你的素材",
  "正在整理內容重點",
  "正在產生三版文案",
  "正在規劃三版剪輯方向",
  "正在準備標題與標籤",
  "完成",
];

export function ProcessingView() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const progress = Math.round(((activeIndex + 0.6) / progressSteps.length) * 100);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= progressSteps.length - 1) {
          window.clearInterval(interval);
          window.setTimeout(
            () => router.push(`/projects/${DEMO_PROJECT_ID}/results`),
            900,
          );
          return current;
        }
        return current + 1;
      });
    }, 850);

    return () => window.clearInterval(interval);
  }, [router]);

  return (
    <div className="mx-auto max-w-3xl py-4 sm:py-10">
      <div className="text-center">
        <span className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl border border-[#e2b8bd]/20 bg-[#e2b8bd]/10 text-[#e2b8bd]">
          <Sparkles className="size-6" />
        </span>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">
          正在為你製作內容
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-zinc-500">
          你可以先休息一下，完成後會自動顯示結果。
        </p>
      </div>

      <div className="relative mt-12 overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#100f10] p-6 sm:p-9">
        <div className="pointer-events-none absolute right-[-80px] top-[-100px] size-64 rounded-full bg-[#d7aeb4]/[0.07] blur-3xl" />
        <div className="relative">
          <div className="mb-8 flex items-center justify-between">
            <span className="text-xs text-zinc-500">製作進度</span>
            <span className="text-xs font-medium text-[#e2b8bd]">
              {activeIndex === progressSteps.length - 1 ? 100 : progress}%
            </span>
          </div>
          <div className="mb-9 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#b98e95] to-[#ebcbd0] transition-all duration-700"
              style={{
                width: `${
                  activeIndex === progressSteps.length - 1 ? 100 : progress
                }%`,
              }}
            />
          </div>

          <ol className="space-y-1">
            {progressSteps.map((label, index) => {
              const done = index < activeIndex || activeIndex === progressSteps.length - 1;
              const active = index === activeIndex && !done;
              return (
                <li
                  key={label}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl px-3 py-3.5 transition duration-500",
                    active && "bg-white/[0.035]",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full border transition",
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
                      "text-sm transition",
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

      <p className="mt-6 text-center text-[11px] text-zinc-700">
        請保持此頁開啟，完成後將自動前往結果
      </p>
    </div>
  );
}
