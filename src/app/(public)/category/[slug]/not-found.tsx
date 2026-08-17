import Link from "next/link";

export default function CategoryNotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="text-[10px] uppercase tracking-[0.22em] text-[#d3b176]">
        404
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
        找不到這個分類
      </h1>
      <p className="mt-4 text-sm leading-7 text-zinc-500">
        這個分類不存在，或次分類尚未開放。
      </p>
      <Link href="/" className="mt-8 inline-block text-sm text-[#e2b8bd] hover:text-white">
        返回首頁
      </Link>
    </div>
  );
}
