import {
  Building2,
  FilePlus2,
  Files,
  Home,
  Palette,
  Share2,
  Sparkles,
  Video,
} from "lucide-react";
import Link from "next/link";

import { AccountMenu } from "@/components/account-menu";
import { BrandSwitcher } from "@/components/admin/brand-switcher";
import { Logo } from "@/components/ui/logo";
import type { BrandContext } from "@/types/brand";

const navigation = [
  { href: "/admin", label: "後台首頁", icon: Home },
  { href: "/admin/content", label: "內容管理", icon: Files },
  { href: "/admin/content/new", label: "新增報導", icon: FilePlus2 },
  { href: "/admin/assistant", label: "AI 報導助手", icon: Sparkles },
  { href: "/admin/social", label: "社群發布", icon: Share2 },
  { href: "/admin/assistant/new", label: "開始製作", icon: Video },
  { href: "/styles", label: "品牌風格", icon: Palette },
];

export function DashboardShell({
  email,
  brandContext,
  children,
}: {
  email: string;
  brandContext?: BrandContext | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#090809] text-white lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-white/[0.07] bg-[#0d0c0d] lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-5 lg:h-20 lg:px-6">
          <Link href="/admin">
            <Logo />
          </Link>
          <div className="lg:hidden">
            <AccountMenu variant="admin" />
          </div>
        </div>
        {brandContext?.showSwitcher ? (
          <div className="px-4 pb-3">
            <BrandSwitcher
              brands={brandContext.brands}
              activeBrandId={brandContext.brand.id}
            />
          </div>
        ) : null}
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:px-4 lg:pb-0">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-zinc-500 transition hover:bg-white/[0.05] hover:text-white lg:text-sm"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          {brandContext?.showManagement ? (
            <Link
              href="/admin/brands"
              className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-zinc-500 transition hover:bg-white/[0.05] hover:text-white lg:text-sm"
            >
              <Building2 className="size-4" />
              品牌管理
            </Link>
          ) : null}
        </nav>
        <div className="absolute bottom-0 left-0 hidden w-60 border-t border-white/[0.07] p-4 lg:block">
          <p className="truncate px-3 text-[11px] text-zinc-700">{email}</p>
          <div className="mt-2">
            <AccountMenu variant="admin" />
          </div>
        </div>
      </aside>
      <main className="min-w-0">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
