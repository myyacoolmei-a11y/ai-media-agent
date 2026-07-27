"use client";

import { Check, CheckCircle2, Copy, Hash, ScanText, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { mockAiResult, mockTranscript } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function ResultsView() {
  const result = mockAiResult.content;
  const [activeVariant, setActiveVariant] = useState(0);
  const [copied, setCopied] = useState("");

  async function copyText(id: string, text: string) {
    await navigator.clipboard?.writeText(text);
    setCopied(id);
    window.setTimeout(() => setCopied(""), 1200);
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-6 border-b border-white/[0.07] pb-9 sm:flex-row sm:items-end">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/[0.06] px-3 py-1.5 text-[11px] font-medium text-lime-300">
            <CheckCircle2 className="size-3" />
            分析完成
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
            你的內容已準備好
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            AI 已整理內容重點，並生成三種文案方向。
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            copyText(
              "all",
              `${result.titles[0]}\n\n${result.copyVariants[activeVariant].content}\n\n${result.hashtags.join(" ")}`,
            )
          }
        >
          {copied === "all" ? <Check className="size-4" /> : <Copy className="size-4" />}
          複製完整內容
        </Button>
      </div>

      <div className="mt-9 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-6">
          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-2">
              <Sparkles className="size-4 text-lime-300" />
              <h2 className="text-sm font-medium text-zinc-200">三個版本文案</h2>
            </div>
            <div className="mb-6 flex gap-1 rounded-full border border-white/[0.07] bg-black/30 p-1">
              {result.copyVariants.map((variant, index) => (
                <button
                  key={variant.id}
                  onClick={() => setActiveVariant(index)}
                  className={cn(
                    "flex-1 rounded-full px-3 py-2 text-xs font-medium transition",
                    activeVariant === index
                      ? "bg-white/10 text-white"
                      : "text-zinc-600 hover:text-zinc-300",
                  )}
                >
                  {variant.label}
                </button>
              ))}
            </div>
            <p className="min-h-32 text-[15px] leading-8 text-zinc-300">
              {result.copyVariants[activeVariant].content}
            </p>
            <div className="mt-5 flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  copyText("copy", result.copyVariants[activeVariant].content)
                }
              >
                {copied === "copy" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                複製文案
              </Button>
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <ResultCard icon={ScanText} title="建議標題">
              <ol className="space-y-4">
                {result.titles.map((title, index) => (
                  <li key={title} className="flex gap-3 text-sm leading-6 text-zinc-300">
                    <span className="font-mono text-[10px] text-zinc-700">
                      0{index + 1}
                    </span>
                    {title}
                  </li>
                ))}
              </ol>
            </ResultCard>
            <ResultCard icon={Hash} title="Hashtag">
              <div className="flex flex-wrap gap-2">
                {result.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/[0.07] bg-white/[0.035] px-3 py-1.5 text-xs text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </ResultCard>
          </div>

          <ResultCard icon={Sparkles} title="封面文字">
            <div className="grid gap-3 sm:grid-cols-3">
              {result.coverTexts.map((text, index) => (
                <div
                  key={text}
                  className="flex aspect-[16/9] items-end rounded-2xl border border-white/[0.07] bg-[radial-gradient(circle_at_70%_20%,rgba(190,242,100,0.12),transparent_38%),#090909] p-4"
                >
                  <p className="max-w-36 text-lg font-semibold leading-tight tracking-[-0.03em] text-white">
                    {text}
                    <span className="ml-1 text-lime-300">.</span>
                  </p>
                  <span className="ml-auto font-mono text-[9px] text-zinc-700">
                    0{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </ResultCard>
        </main>

        <aside className="space-y-6">
          <ResultCard icon={CheckCircle2} title="內容重點">
            <ul className="space-y-4">
              {result.summary.map((item) => (
                <li key={item} className="flex gap-3 text-xs leading-6 text-zinc-400">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-lime-300" />
                  {item}
                </li>
              ))}
            </ul>
          </ResultCard>
          <ResultCard icon={ScanText} title="逐字稿">
            <p className="text-xs leading-6 text-zinc-500">{mockTranscript.text}</p>
            <p className="mt-4 font-mono text-[10px] text-zinc-700">
              {mockTranscript.language} · Whisper mock
            </p>
          </ResultCard>
          <ResultCard icon={Sparkles} title="畫面洞察">
            <ul className="space-y-2">
              {result.visualInsights.map((item) => (
                <li key={item} className="text-xs text-zinc-500">
                  — {item}
                </li>
              ))}
            </ul>
          </ResultCard>
        </aside>
      </div>
    </div>
  );
}

function ResultCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6">
      <div className="mb-5 flex items-center gap-2">
        <Icon className="size-4 text-lime-300" />
        <h2 className="text-sm font-medium text-zinc-200">{title}</h2>
      </div>
      {children}
    </section>
  );
}
