import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { AccountMenu } from "@/components/account-menu";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { SITE_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="relative z-30 border-b border-white/[0.06]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label={`${SITE_NAME}首頁`}>
          <Logo />
        </Link>
        <nav className="flex items-center gap-1">
          <AccountMenu />
          <Link
            href="/admin"
            className={cn(buttonVariants({ size: "sm" }), "group")}
          >
            後台
            {!compact && (
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
