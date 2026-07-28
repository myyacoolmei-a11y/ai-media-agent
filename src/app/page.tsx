import { ArrowRight, Images, Mic2, ShieldCheck, Video } from "lucide-react";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

const uploadOptions = [
  {
    type: "video",
    icon: Video,
    title: "上傳影片",
    description: "從手機或電腦選擇影片",
    detail: "MP4、MOV、WebM",
    accent: "from-[#e2b8bd]/18 to-transparent",
  },
  {
    type: "photos",
    icon: Images,
    title: "上傳照片",
    description: "一次選擇多張照片",
    detail: "JPG、PNG、WebP",
    accent: "from-[#c9ad7f]/16 to-transparent",
  },
  {
    type: "audio",
    icon: Mic2,
    title: "錄製或上傳語音",
    description: "直接說，或選擇音訊檔",
    detail: "手機錄音、MP3、WAV",
    accent: "from-[#b6a7bd]/16 to-transparent",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#090809]">
      <SiteHeader />
      <main className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-[-180px] h-[680px] bg-[radial-gradient(ellipse_at_top,rgba(213,165,172,0.12),transparent_58%)]" />
        <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-[11px] text-zinc-400">
              <span className="size-1.5 rounded-full bg-[#d4b073]" />
              從一份素材開始
            </span>
            <h1 className="text-4xl font-semibold tracking-[-0.055em] text-white sm:text-6xl">
              今天想製作什麼內容？
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-lg sm:leading-8">
              上傳影片、照片或語音，AI
              幫你整理內容、產生文案與規劃剪輯版本。
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:mt-16 sm:grid-cols-3">
            {uploadOptions.map((option) => (
              <Link
                key={option.type}
                href={`/projects/new?type=${option.type}`}
                className="group relative min-h-56 overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#111011] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#e2b8bd]/30 hover:bg-[#151214] sm:min-h-72 sm:p-7"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${option.accent} opacity-70 transition group-hover:opacity-100`}
                />
                <div className="relative flex h-full flex-col">
                  <span className="grid size-14 place-items-center rounded-2xl border border-white/10 bg-black/20 text-[#e6c8cc] shadow-inner">
                    <option.icon className="size-6" strokeWidth={1.5} />
                  </span>
                  <div className="mt-auto pt-12">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-xl font-medium tracking-[-0.03em] text-white">
                        {option.title}
                      </h2>
                      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 text-zinc-500 transition group-hover:border-[#e2b8bd]/30 group-hover:bg-[#e2b8bd] group-hover:text-black">
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-400">
                      {option.description}
                    </p>
                    <p className="mt-2 text-[11px] text-zinc-600">
                      {option.detail}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mx-auto mt-8 flex max-w-5xl flex-col items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-center sm:flex-row sm:text-left">
            <p className="flex items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck className="size-4 text-[#c9ad7f]" />
              素材只用於本次內容製作
            </p>
            <Link
              href="/projects/demo-project/results"
              className="text-xs text-zinc-500 transition hover:text-white"
            >
              先看看完成範例
              <ArrowRight className="ml-1.5 inline size-3" />
            </Link>
          </div>
        </section>
      </main>
      <footer className="px-5 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between border-t border-white/[0.06] pt-7 text-[11px] text-zinc-700">
          <span>AI Media Agent</span>
          <span>讓內容製作更簡單</span>
        </div>
      </footer>
    </div>
  );
}
