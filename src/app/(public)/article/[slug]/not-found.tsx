import Link from "next/link";

export default function ArticleNotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="text-[10px] uppercase tracking-[0.22em] text-[#d3b176]">
        404
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
        找不到這篇報導
      </h1>
      <p className="mt-4 text-sm leading-7 text-zinc-500">
        這篇內容可能仍是草稿、尚未到發布時間，或不存在。
      </p>
      <Link href="/news" className="mt-8 inline-block text-sm text-[#e2b8bd] hover:text-white">
        返回最新報導
      </Link>
    </div>
  );
}
