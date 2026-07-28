"use client";

import { ArrowRight, Link2, LoaderCircle, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import type { BrandStyleInput, BrandStyleProfile } from "@/types/style";

const emptyStyle: BrandStyleInput = {
  style_name: "",
  brand_description: "",
  target_audience: "",
  brand_personality: "",
  preferred_tone: "",
  forbidden_tone: "",
  preferred_hook_style: "",
  preferred_story_structure: "",
  preferred_editing_pace: "",
  preferred_subtitle_style: "",
  preferred_color_direction: "",
  preferred_music_direction: "",
  preferred_cta: "",
  logo_position: "",
  intro_template: "",
  outro_template: "",
  reference_content: [],
  negative_examples: "",
};

const fields: Array<{
  key: keyof BrandStyleInput;
  label: string;
  placeholder: string;
  optional?: boolean;
}> = [
  { key: "style_name", label: "風格名稱", placeholder: "例如：個人品牌" },
  {
    key: "brand_description",
    label: "品牌描述",
    placeholder: "品牌在做什麼、相信什麼，以及希望被如何記住",
  },
  {
    key: "target_audience",
    label: "目標觀眾",
    placeholder: "例如：正在經營個人品牌的 25–40 歲創業者",
  },
  {
    key: "brand_personality",
    label: "品牌個性",
    placeholder: "例如：真誠、直接、有洞察力、不說教",
  },
  {
    key: "preferred_tone",
    label: "喜歡的語氣",
    placeholder: "例如：像有經驗的朋友，簡潔但有溫度",
  },
  {
    key: "forbidden_tone",
    label: "不喜歡的語氣",
    placeholder: "例如：誇大、權威說教、過度促銷",
    optional: true,
  },
  {
    key: "preferred_hook_style",
    label: "喜歡的開頭方式",
    placeholder: "例如：用一個真實問題開場，不使用聳動標題",
  },
  {
    key: "preferred_story_structure",
    label: "偏好的故事結構",
    placeholder: "例如：問題 → 過程 → 發現 → 可執行建議",
  },
  {
    key: "preferred_editing_pace",
    label: "剪輯節奏",
    placeholder: "例如：前 5 秒快速，之後保留自然停頓",
  },
  {
    key: "preferred_subtitle_style",
    label: "字幕樣式",
    placeholder: "例如：白色簡潔字幕，關鍵字淡金色，不使用跳動動畫",
  },
  {
    key: "preferred_color_direction",
    label: "色彩方向",
    placeholder: "例如：暖灰、米白與低飽和金色",
  },
  {
    key: "preferred_music_direction",
    label: "音樂方向",
    placeholder: "例如：輕柔電子樂，不使用過度激昂配樂",
  },
  {
    key: "preferred_cta",
    label: "行動呼籲",
    placeholder: "例如：邀請留言分享經驗，不強迫購買",
  },
  {
    key: "logo_position",
    label: "Logo 位置",
    placeholder: "例如：右上角，保持小尺寸與安全邊距",
  },
  {
    key: "intro_template",
    label: "固定片頭",
    placeholder: "例如：0.5 秒品牌字標淡入",
    optional: true,
  },
  {
    key: "outro_template",
    label: "固定片尾",
    placeholder: "例如：品牌名稱、網址與一句簡短邀請",
    optional: true,
  },
  {
    key: "negative_examples",
    label: "不喜歡的風格或反面範例",
    placeholder: "描述絕對不要出現的文案、畫面、節奏或參考案例",
    optional: true,
  },
];

export function StyleProfileForm({
  initialStyle,
}: {
  initialStyle?: BrandStyleProfile;
}) {
  const router = useRouter();
  const [style, setStyle] = useState<BrandStyleInput>(
    initialStyle ?? emptyStyle,
  );
  const [referenceUrl, setReferenceUrl] = useState("");
  const [referenceDescription, setReferenceDescription] = useState("");
  const [referenceType, setReferenceType] =
    useState<"video" | "article" | "social" | "other">("video");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function addReference() {
    try {
      new URL(referenceUrl);
    } catch {
      setError("請輸入完整的參考內容網址。");
      return;
    }
    setStyle((current) => ({
      ...current,
      reference_content: [
        ...current.reference_content,
        {
          type: referenceType,
          url: referenceUrl,
          description: referenceDescription,
        },
      ],
    }));
    setReferenceUrl("");
    setReferenceDescription("");
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch(
      initialStyle ? `/api/styles/${initialStyle.id}` : "/api/styles",
      {
        method: initialStyle ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          initialStyle ? { action: "update", style } : style,
        ),
      },
    );
    const payload = (await response.json()) as {
      style?: BrandStyleProfile;
      error?: string;
    };
    setSaving(false);
    if (!response.ok || !payload.style) {
      setError(payload.error || "風格儲存失敗。");
      return;
    }
    router.push(`/styles/${payload.style.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => {
          const value = style[field.key];
          if (Array.isArray(value)) return null;
          const multiline = field.key !== "style_name";
          return (
            <label
              key={field.key}
              className={field.key === "style_name" ? "sm:col-span-2" : ""}
            >
              <span className="mb-2 block text-xs text-zinc-400">
                {field.label}
                {field.optional && <span className="text-zinc-700">（選填）</span>}
              </span>
              {multiline ? (
                <textarea
                  required={!field.optional}
                  rows={3}
                  value={value}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    setStyle((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white outline-none placeholder:text-zinc-700 focus:border-[#deb5bb]/40"
                />
              ) : (
                <input
                  required
                  value={value}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    setStyle((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#deb5bb]/40"
                />
              )}
            </label>
          );
        })}
      </div>

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="mb-5">
          <h3 className="text-sm font-medium text-white">匯入參考影片或文章</h3>
          <p className="mt-1 text-xs leading-5 text-zinc-600">
            加入你喜歡的影片、文章或社群貼文網址，AI 只學習風格，不複製內容。
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
          <select
            value={referenceType}
            onChange={(event) =>
              setReferenceType(
                event.target.value as typeof referenceType,
              )
            }
            className="h-11 rounded-xl border border-white/10 bg-[#111] px-3 text-xs text-zinc-300 outline-none"
          >
            <option value="video">影片</option>
            <option value="article">文章</option>
            <option value="social">社群貼文</option>
            <option value="other">其他</option>
          </select>
          <input
            type="url"
            value={referenceUrl}
            onChange={(event) => setReferenceUrl(event.target.value)}
            placeholder="https://..."
            className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
          />
          <span />
          <div className="flex gap-2">
            <input
              value={referenceDescription}
              onChange={(event) => setReferenceDescription(event.target.value)}
              placeholder="喜歡這份內容的哪些地方？"
              className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
            />
            <Button type="button" size="sm" variant="secondary" onClick={addReference}>
              <Plus className="size-3.5" />
              加入
            </Button>
          </div>
        </div>
        {style.reference_content.length > 0 && (
          <ul className="mt-5 space-y-2">
            {style.reference_content.map((reference, index) => (
              <li
                key={`${reference.url}-${index}`}
                className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3"
              >
                <Link2 className="size-3.5 shrink-0 text-[#d3b176]" />
                <span className="min-w-0 flex-1 truncate text-xs text-zinc-400">
                  {reference.description || reference.url}
                </span>
                <button
                  type="button"
                  aria-label="移除參考內容"
                  onClick={() =>
                    setStyle((current) => ({
                      ...current,
                      reference_content: current.reference_content.filter(
                        (_, referenceIndex) => referenceIndex !== index,
                      ),
                    }))
                  }
                  className="text-zinc-600 hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && (
        <p className="rounded-xl bg-red-300/[0.07] p-3 text-xs text-red-200">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {initialStyle ? "儲存風格設定" : "建立我的風格"}
          {!saving && <ArrowRight className="size-4" />}
        </Button>
      </div>
    </form>
  );
}
