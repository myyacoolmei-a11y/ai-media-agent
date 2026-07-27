import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="relative z-30 border-b border-white/[0.06]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="AI Media Agent 首頁">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1">
          {!compact && (
            <a
              href="#workflow"
              className="hidden rounded-full px-4 py-2 text-sm text-zinc-500 transition hover:text-white sm:block"
            >
              工作流程
            </a>
          )}
          <span className="mx-2 hidden h-4 w-px bg-white/10 sm:block" />
          <Link
            href="/projects/new"
            className={cn(buttonVariants({ size: "sm" }), "group")}
          >
            <Plus className="size-3.5" />
            新專案
            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
