"use client";

import { ArrowRight, FileText, ImageIcon, LoaderCircle, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContentType } from "@/types/content";

const modes: Array<{
  type: ContentType;
  title: string;
  description: string;
  icon: typeof FileText;
}> = [
  {
    type: "video",
    title: "影片內容",
    description: "上傳影片、整理字幕與撰寫發布內容",
    icon: Video,
  },
  {
    type: "image",
    title: "圖文內容",
    description: "上傳一張或多張圖片並建立圖文",
    icon: ImageIcon,
  },
  {
    type: "article",
    title: "文章內容",
    description: "直接輸入文字，建立摘要與完整文章",
    icon: FileText,
  },
];

export function NewContentForm() {
  const router = useRouter();
  const [type, setType] = useState<ContentType>("article");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  async function create() {
    setCreating(true);
    setError("");
    const uniqueSlug = `content-${Date.now().toString(36)}`;
    const response = await fetch("/api/contents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        slug: uniqueSlug,
        summary: "",
        content: "",
        videoUrl: "",
        category: "未分類",
        contentType: type,
        styleProfileId: null,
      }),
    });
    const payload = (await response.json()) as {
      content?: { id: string };
      error?: string;
    };
    if (!response.ok || !payload.content) {
      setError(payload.error || "無法建立內容。");
      setCreating(false);
      return;
    }
    router.push(`/dashboard/contents/${payload.content.id}/edit`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-[-0.045em]">新增內容</h1>
      <p className="mt-3 text-sm text-zinc-500">
        選擇內容類型。建立後會先保存為草稿。
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {modes.map((mode) => (
          <button
            key={mode.type}
            type="button"
            onClick={() => setType(mode.type)}
            className={cn(
              "rounded-3xl border p-5 text-left transition",
              type === mode.type
                ? "border-[#deb5bb]/35 bg-[#deb5bb]/10"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/15",
            )}
          >
            <mode.icon className="size-5 text-[#d3b176]" />
            <p className="mt-8 text-sm font-medium text-white">{mode.title}</p>
            <p className="mt-2 text-xs leading-5 text-zinc-600">
              {mode.description}
            </p>
          </button>
        ))}
      </div>

      <label className="mt-6 block">
        <span className="mb-2 block text-xs text-zinc-400">
          暫定標題（可稍後修改）
        </span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="輸入內容標題"
          className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.025] px-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#deb5bb]/40"
        />
      </label>

      {error && (
        <p className="mt-5 rounded-xl bg-red-300/[0.07] p-3 text-xs text-red-200">
          {error}
        </p>
      )}
      <div className="mt-7 flex justify-end">
        <Button size="lg" onClick={create} disabled={creating}>
          {creating ? <LoaderCircle className="size-4 animate-spin" /> : null}
          建立草稿
          {!creating && <ArrowRight className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
