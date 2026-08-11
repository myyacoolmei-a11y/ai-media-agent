"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { TextAiAction, TextAiResult } from "@/types/content-ai";

const actions: Array<{ value: TextAiAction; label: string }> = [
  { value: "organize", label: "AI 整理" },
  { value: "rewrite", label: "AI 改寫" },
  { value: "title", label: "AI 下標題" },
  { value: "summary", label: "AI 摘要" },
  { value: "article", label: "AI 完整文章" },
  { value: "social", label: "AI 社群文案" },
];

export function ContentAiTools({
  contentId,
  sourceText,
  onApply,
}: {
  contentId: string;
  sourceText: string;
  onApply: (result: TextAiResult, action: TextAiAction) => void;
}) {
  const [loading, setLoading] = useState<TextAiAction | null>(null);
  const [result, setResult] = useState<TextAiResult | null>(null);
  const [resultAction, setResultAction] = useState<TextAiAction>("organize");
  const [error, setError] = useState("");

  async function run(action: TextAiAction) {
    if (!sourceText.trim()) {
      setError("請先輸入文字內容。");
      return;
    }
    if (
      !window.confirm(
        "這是選配的付費 AI 文字功能。確定要送出目前文字並呼叫 AI 嗎？",
      )
    ) {
      return;
    }
    setLoading(action);
    setError("");
    const response = await fetch(`/api/contents/${contentId}/ai/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, sourceText }),
    });
    const payload = (await response.json()) as {
      result?: TextAiResult;
      error?: string;
    };
    setLoading(null);
    if (!response.ok || !payload.result) {
      setError(payload.error || "AI 文字處理失敗。");
      return;
    }
    setResult(payload.result);
    setResultAction(action);
  }

  return (
    <section className="rounded-3xl border border-[#d3b176]/15 bg-[#d3b176]/[0.035] p-5">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 size-4 text-[#d3b176]" />
        <div>
          <h2 className="text-sm font-medium text-white">選配 AI 文字工具</h2>
          <p className="mt-1 text-[11px] leading-5 text-zinc-600">
            只有點擊下方功能才會呼叫付費 API；一般編輯、圖片與影片處理不會扣 AI 費用。
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.value}
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading !== null}
            onClick={() => run(action.value)}
          >
            {loading === action.value && (
              <LoaderCircle className="size-3.5 animate-spin" />
            )}
            {action.label}
          </Button>
        ))}
      </div>
      {error && <p className="mt-4 text-xs text-red-300">{error}</p>}
      {result && (
        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
          <p className="text-xs font-medium text-zinc-300">{result.title}</p>
          <p className="mt-2 text-xs leading-6 text-zinc-500">{result.summary}</p>
          <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-xs leading-6 text-zinc-400">
            {result.content}
          </p>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onApply(result, resultAction);
                setResult(null);
              }}
            >
              套用到編輯器
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
