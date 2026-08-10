import { FilePlus2, Files } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountMenu } from "@/components/account-menu";
import { Logo } from "@/components/ui/logo";
import { getAuthenticatedUser } from "@/lib/jobs/access";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/admin/login?next=/admin");

  return (
    <div className="min-h-screen bg-[#090809]">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-5 px-5 sm:px-8">
          <Link href="/admin">
            <Logo />
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-full px-3 py-2 text-xs text-zinc-500 hover:text-white"
            >
              <Files className="size-3.5" />
              文章列表
            </Link>
            <Link
              href="/admin/new"
              className="flex items-center gap-2 rounded-full px-3 py-2 text-xs text-zinc-500 hover:text-white"
            >
              <FilePlus2 className="size-3.5" />
              新增文章
            </Link>
            <AccountMenu />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
