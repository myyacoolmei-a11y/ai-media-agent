import {
  Captions,
  Hash,
  ScanSearch,
  Sparkles,
  Type,
  Upload,
} from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

const capabilities = [
  {
    title: "影片上傳",
    description: "把原始影片素材送到私人 Storage，作為報導製作起點。",
    icon: Upload,
  },
  {
    title: "語音辨識",
    description: "用 Whisper 產出含時間點的逐字稿，方便整理報導內文。",
    icon: Captions,
  },
  {
    title: "畫面分析",
    description: "擷取代表畫面與重點鏡頭，協助挑選封面與影音段落。",
    icon: ScanSearch,
  },
  {
    title: "AI 文案",
    description: "依品牌風格產生報導／社群文案草稿，再由編輯修改。",
    icon: Sparkles,
  },
  {
    title: "標題",
    description: "一次產出多組標題建議，選完可直接進入內容後台。",
    icon: Type,
  },
  {
    title: "SEO 與 Hashtag",
    description: "整理關鍵字與標籤，方便後續發布，不會直接出現在公開首頁。",
    icon: Hash,
  },
];

export default function AssistantPage() {
  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#d3b176]">
            Assistant
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
            AI 報導助手
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-500">
            既有的影片上傳、語音辨識、畫面分析與 AI 文案都還在，只是改從後台使用。
            產出草稿後，再到內容管理發布，公開網站才會看到。
          </p>
        </div>
        <Link href="/admin/assistant/new" className={buttonVariants()}>
          <Sparkles className="size-4" />
          開始製作
        </Link>
      </div>

      <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map(({ title, description, icon: Icon }) => (
          <div
            key={title}
            className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5"
          >
            <Icon className="size-4 text-[#d3b176]" />
            <h2 className="mt-5 text-sm font-medium">{title}</h2>
            <p className="mt-2 text-xs leading-6 text-zinc-500">{description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3 text-xs">
        <Link
          href="/styles"
          className="rounded-full border border-white/10 px-4 py-2 text-zinc-400 hover:text-white"
        >
          品牌風格
        </Link>
        <Link
          href="/admin/content"
          className="rounded-full border border-white/10 px-4 py-2 text-zinc-400 hover:text-white"
        >
          回到內容管理
        </Link>
      </div>
    </div>
  );
}
