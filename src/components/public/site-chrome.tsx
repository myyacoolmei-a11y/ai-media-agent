"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AccountMenu } from "@/components/account-menu";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "首頁" },
  { href: "/news", label: "最新報導" },
  { href: "/video", label: "影音報導" },
];

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/[0.07] bg-[#090809]/95 backdrop-blur">
      <div className="h-0.5 bg-gradient-to-r from-[#d3b176] via-[#e2b8bd] to-[#d3b176]" />
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link href="/" aria-label="AI Media 首頁">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-xs">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-2 transition",
                  active ? "bg-white/[0.06] text-white" : "text-zinc-500 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto">
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-white/[0.07]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} AI Media</p>
        <p>前台僅顯示已發布內容</p>
      </div>
    </footer>
  );
}
