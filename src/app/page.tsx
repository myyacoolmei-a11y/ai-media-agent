import {
  ArrowRight,
  AudioLines,
  Clapperboard,
  FileText,
  ScanSearch,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { WorkflowRail } from "@/components/workflow-rail";
import { cn } from "@/lib/utils";

export default function Home() {
  const previewCards = [
    { icon: AudioLines, label: "逐字稿", value: "已完成" },
    { icon: ScanSearch, label: "畫面分析", value: "12 scenes" },
    { icon: FileText, label: "社群文案", value: "3 versions" },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#070707]">
      <SiteHeader />
      <main>
        <section className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[680px] bg-[radial-gradient(ellipse_45%_45%_at_50%_20%,rgba(190,242,100,0.09),transparent)]" />
          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 px-5 pb-28 pt-24 sm:px-8 sm:pt-32 lg:grid-cols-[1fr_480px] lg:pb-36">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.035] px-3 py-1.5 text-[11px] text-zinc-400">
                <span className="size-1.5 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(190,242,100,0.8)]" />
                AI 原生內容工作流
              </div>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.065em] text-white sm:text-7xl lg:text-[82px]">
                素材進來
                <br />
                <span className="text-zinc-600">內容完成。</span>
              </h1>
              <p className="mt-8 max-w-xl text-base leading-8 text-zinc-500 sm:text-lg">
                上傳一支影片，AI 自動聽懂語音、看懂畫面，
                整理成文案、標題、Hashtag 與封面文字。
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/projects/new"
                  className={cn(buttonVariants({ size: "lg" }), "group")}
                >
                  上傳第一支影片
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/projects/demo-project/results"
                  className={buttonVariants({ variant: "secondary", size: "lg" })}
                >
                  查看範例結果
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[480px]">
              <div className="absolute -inset-10 rounded-full bg-lime-300/[0.035] blur-3xl" />
              <div className="animate-float relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0c0c0c] p-3 shadow-2xl shadow-black">
                <div className="aspect-[4/3] rounded-3xl border border-white/[0.06] bg-[radial-gradient(circle_at_68%_25%,rgba(190,242,100,0.17),transparent_30%),linear-gradient(145deg,#181818,#080808)] p-6">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-black/40 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                      Studio footage · 01:34
                    </span>
                    <span className="flex items-center gap-1.5 rounded-full border border-lime-300/20 bg-lime-300/10 px-2.5 py-1 text-[9px] text-lime-300">
                      <span className="size-1 rounded-full bg-lime-300" />
                      Analyzing
                    </span>
                  </div>
                  <div className="flex h-[calc(100%-36px)] items-center justify-center">
                    <div className="grid size-24 place-items-center rounded-full border border-white/10 bg-black/20 backdrop-blur">
                      <Clapperboard
                        className="size-8 text-zinc-300"
                        strokeWidth={1.3}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 p-3 pb-1">
                  {previewCards.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3"
                    >
                      <Icon className="mb-5 size-4 text-lime-300" />
                      <p className="text-[10px] text-zinc-600">{label}</p>
                      <p className="mt-1 text-xs font-medium text-zinc-300">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="border-y border-white/[0.06] bg-white/[0.012]"
        >
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
            <div className="mb-14 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-lime-300">
                  One input. Full output.
                </p>
                <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                  一條專為媒體內容設計的 AI Pipeline
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <UploadCloud className="size-3.5" />
                目前支援影片輸入
              </div>
            </div>
            <WorkflowRail />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 text-center sm:px-8 sm:py-36">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-600">
            Ready when you are
          </p>
          <h2 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
            把剪輯前最花時間的工作，
            <span className="text-zinc-600">交給 AI。</span>
          </h2>
          <Link
            href="/projects/new"
            className={cn(buttonVariants({ size: "lg" }), "mt-9")}
          >
            建立新專案
            <ArrowRight className="size-4" />
          </Link>
        </section>
      </main>
      <footer className="border-t border-white/[0.06] px-5 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-[11px] text-zinc-700 sm:px-3">
          <span>AI Media Agent</span>
          <span>MVP · Phase 01</span>
        </div>
      </footer>
    </div>
  );
}
