import {
  ExternalLink,
  FilePlus2,
  Files,
  Home,
  Megaphone,
  Share2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { AccountMenu } from "@/components/account-menu";
import { Logo } from "@/components/ui/logo";

const navigation = [
  { href: "/admin", label: "後台首頁", icon: Home },
  { href: "/admin/content", label: "內容管理", icon: Files },
  { href: "/admin/content/new", label: "新增報導", icon: FilePlus2 },
  { href: "/admin/assistant", label: "AI 報導助手", icon: Sparkles },
  { href: "/admin/social", label: "社群發布", icon: Share2 },
  { href: "/admin/ads", label: "廣告管理", icon: Megaphone },
];

export function AdminHeader() {
  return (
    <header className="border-b border-white/[0.07]">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-8">
        <Link href="/admin" className="shrink-0">
          <Logo />
        </Link>
        <nav className="no-scrollbar ml-auto flex items-center gap-1 overflow-x-auto">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs text-zinc-500 hover:text-white"
            >
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs text-zinc-500 hover:text-white"
          >
            <ExternalLink className="size-3.5" />
            <span className="hidden sm:inline">前台</span>
          </Link>
          <AccountMenu variant="admin" />
        </nav>
      </div>
    </header>
  );
}
