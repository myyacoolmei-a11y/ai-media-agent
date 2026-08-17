"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { AccountMenu } from "@/components/account-menu";
import { Logo } from "@/components/ui/logo";
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
    <header className="border-b border-white/[0.07] bg-[#090809]/95 backdrop-blur">
      <div className="h-0.5 bg-gradient-to-r from-[#d3b176] via-[#e2b8bd] to-[#d3b176]" />
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:h-16 sm:px-8">
        <Link href="/" aria-label="AI Media 首頁" className="shrink-0">
          <Logo wordmark="AI Media" />
        </Link>
        <p className="hidden text-[11px] text-zinc-600 sm:block">{today}</p>
        <div className="ml-auto">
          <AccountMenu />
        </div>
      </div>
      <nav className="border-t border-white/[0.06]">
        <div className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-8">
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
                  "shrink-0 rounded-full px-3 py-1.5 text-xs transition sm:px-3.5 sm:text-sm",
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-500 hover:text-white",
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
    <footer className="border-t border-white/[0.07]">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} AI Media</p>
        <p>前台僅顯示已發布內容</p>
      </div>
    </footer>
  );
}
