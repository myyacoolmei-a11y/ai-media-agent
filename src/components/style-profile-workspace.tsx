"use client";

import { Copy, RefreshCcw, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { StyleProfileForm } from "@/components/style-profile-form";
import { Button } from "@/components/ui/button";
import type {
  BrandStyleProfile,
  PreferenceSuggestion,
} from "@/types/style";

type StyleFeedback = {
  id: string;
  feedback_type: string;
  user_action: string;
  final_choice: unknown;
  created_at: string;
};

const feedbackLabels: Record<string, string> = {
  copy_edit: "修改文案",
  title_edit: "改寫標題",
  segment_removed: "拒絕片段",
  segment_order: "調整剪輯順序",
  subtitle_style: "修改字幕樣式",
  editing_pace: "修改影片節奏",
  cta_edit: "變更 CTA",
  cover_selected: "選擇封面",
  logo_position: "調整 Logo 位置",
  version_selected: "選擇版本",
};

export function StyleProfileWorkspace({
  style,
  initialFeedback,
  initialSuggestions,
}: {
  style: BrandStyleProfile;
  initialFeedback: StyleFeedback[];
  initialSuggestions: PreferenceSuggestion[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"settings" | "learning">("settings");
  const [feedback, setFeedback] = useState(initialFeedback);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [duplicateName, setDuplicateName] = useState(`${style.style_name} 副本`);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  async function styleAction(body: object) {
    const response = await fetch(`/api/styles/${style.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as {
      style?: BrandStyleProfile;
      error?: string;
    };
    if (!response.ok) throw new Error(payload.error || "操作失敗。");
    return payload;
  }

  async function duplicate() {
    setBusy("duplicate");
    setMessage("");
    try {
      const payload = await styleAction({
        action: "duplicate",
        styleName: duplicateName,
      });
      if (payload.style) router.push(`/styles/${payload.style.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "複製失敗。");
    } finally {
      setBusy("");
    }
  }

  async function resetLearning() {
    if (!window.confirm("確定要清除這個風格累積的所有學習紀錄嗎？")) return;
    setBusy("reset");
    await styleAction({ action: "reset-learning" });
    setFeedback([]);
    setSuggestions([]);
    setMessage("風格學習紀錄已重設，原始風格設定保持不變。");
    setBusy("");
  }

  async function decideSuggestion(
    suggestion: PreferenceSuggestion,
    decision: "accept" | "dismiss",
  ) {
    setBusy(suggestion.id);
    const response = await fetch(
      `/api/styles/${style.id}/suggestions/${suggestion.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      },
    );
    const payload = (await response.json()) as { error?: string };
    if (response.ok) {
      setSuggestions((current) =>
        current.map((item) =>
          item.id === suggestion.id
            ? {
                ...item,
                status: decision === "accept" ? "accepted" : "dismissed",
              }
            : item,
        ),
      );
      setMessage(
        decision === "accept"
          ? "已依你的確認更新預設風格。"
          : "已略過這項建議，風格設定沒有改變。",
      );
      router.refresh();
    } else {
      setMessage(payload.error || "更新建議失敗。");
    }
    setBusy("");
  }

  const pendingSuggestions = suggestions.filter(
    (suggestion) => suggestion.status === "pending",
  );

  return (
    <div>
      {pendingSuggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className="mb-5 rounded-3xl border border-[#d3b176]/25 bg-[#d3b176]/[0.06] p-5 sm:flex sm:items-center sm:gap-6"
        >
          <Sparkles className="size-5 shrink-0 text-[#d3b176]" />
          <div className="mt-3 flex-1 sm:mt-0">
            <p className="text-sm font-medium text-white">
              我發現你常使用這種風格，是否更新為你的預設風格？
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {suggestion.explanation}
            </p>
          </div>
          <div className="mt-4 flex gap-2 sm:mt-0">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => decideSuggestion(suggestion, "dismiss")}
            >
              暫不更新
            </Button>
            <Button
              size="sm"
              disabled={busy === suggestion.id}
              onClick={() => decideSuggestion(suggestion, "accept")}
            >
              確認更新
            </Button>
          </div>
        </div>
      ))}

      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#d3b176]">
            Brand style profile
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-white">
            {style.style_name}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            {style.brand_description}
          </p>
        </div>
        <div className="flex rounded-full border border-white/[0.08] bg-white/[0.02] p-1">
          <button
            onClick={() => setTab("settings")}
            className={`rounded-full px-4 py-2 text-xs ${tab === "settings" ? "bg-white/10 text-white" : "text-zinc-600"}`}
          >
            風格設定
          </button>
          <button
            onClick={() => setTab("learning")}
            className={`rounded-full px-4 py-2 text-xs ${tab === "learning" ? "bg-white/10 text-white" : "text-zinc-600"}`}
          >
            AI 學到的偏好
          </button>
        </div>
      </div>

      {message && (
        <p className="mb-6 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 text-xs text-zinc-300">
          {message}
        </p>
      )}

      {tab === "settings" ? (
        <>
          <StyleProfileForm initialStyle={style} />
          <section className="mt-10 rounded-3xl border border-white/[0.08] p-5">
            <h2 className="text-sm font-medium text-white">複製既有風格</h2>
            <p className="mt-1 text-xs text-zinc-600">
              建立一份獨立副本，再針對不同品牌或內容用途調整。
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={duplicateName}
                onChange={(event) => setDuplicateName(event.target.value)}
                className="h-10 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy === "duplicate"}
                onClick={duplicate}
              >
                <Copy className="size-3.5" />
                儲存為新風格
              </Button>
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-5 sm:p-7">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="text-lg font-medium text-white">已累積的修改紀錄</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-600">
                這些紀錄不會自動改變風格。累積相同偏好後，AI 才會提出待確認建議。
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy === "reset"}
              onClick={resetLearning}
            >
              <RefreshCcw className="size-3.5" />
              重設學習
            </Button>
          </div>
          {feedback.length ? (
            <div className="mt-6 space-y-2">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.05] p-3"
                >
                  <div>
                    <p className="text-xs text-zinc-300">
                      {feedbackLabels[item.feedback_type] ?? item.feedback_type}
                    </p>
                    <p className="mt-1 text-[10px] text-zinc-700">
                      {new Date(item.created_at).toLocaleDateString("zh-TW")}
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-600">
                    {item.user_action}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-600">
              還沒有修改紀錄。完成幾次內容製作後，偏好會出現在這裡。
            </div>
          )}
          <button
            type="button"
            onClick={resetLearning}
            className="mt-8 flex items-center gap-2 text-xs text-red-300/60 hover:text-red-300"
          >
            <Trash2 className="size-3.5" />
            清除所有學習資料
          </button>
        </section>
      )}
    </div>
  );
}
