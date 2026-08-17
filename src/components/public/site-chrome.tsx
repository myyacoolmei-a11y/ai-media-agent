"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { AccountMenu } from "@/components/account-menu";
import { publicNavItems } from "@/lib/content/categories";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");
  const today = new Date().toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <header className="border-b border-white/[0.08] bg-[#080708]/95 backdrop-blur">
      <div className="h-[3px] bg-gradient-to-r from-[#d3b176] via-[#e2b8bd] to-[#d3b176]" />
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-8 sm:py-5">
        <Link href="/" aria-label="AI Media 首頁" className="min-w-0 shrink-0">
          <span className="block font-[family-name:var(--font-news-serif)] text-[1.65rem] leading-none tracking-[-0.04em] text-white sm:text-[1.85rem]">
            AI Media
          </span>
          <span className="mt-1.5 block text-[10px] tracking-[0.22em] text-zinc-500">
            即時新聞 · 深度報導
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <p className="hidden text-[11px] tracking-wide text-zinc-500 sm:block">
            {today}
          </p>
          <AccountMenu />
        </div>
      </div>
      <nav className="border-t border-white/[0.07]">
        <div className="no-scrollbar mx-auto flex max-w-7xl gap-0 overflow-x-auto px-2 sm:px-6">
          {publicNavItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.href === "/news"
                  ? pathname === "/news" && !activeCategory
                  : item.href === "/video"
                    ? pathname.startsWith("/video")
                    : pathname === "/news" &&
                      "category" in item &&
                      activeCategory === item.category;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 border-b-2 px-3 py-3 text-[13px] tracking-wide transition sm:px-4 sm:text-sm",
                  active
                    ? "border-[#d3b176] text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-200",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-white/[0.08]">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-10 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-[family-name:var(--font-news-serif)] text-sm tracking-wide text-zinc-400">
          AI Media
        </p>
        <p>前台僅顯示已發布內容</p>
        <p>© {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
