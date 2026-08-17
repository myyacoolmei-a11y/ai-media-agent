import { ExternalLink, FilePlus2, Files, Home } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountMenu } from "@/components/account-menu";
import { Logo } from "@/components/ui/logo";
import { getAuthenticatedUser } from "@/lib/jobs/access";

const navigation = [
  { href: "/admin", label: "後台首頁", icon: Home },
  { href: "/admin/content", label: "內容列表", icon: Files },
  { href: "/admin/content/new", label: "新增報導", icon: FilePlus2 },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?next=/admin");

  return (
    <div className="min-h-screen bg-[#090809]">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-5 px-5 sm:px-8">
          <Link href="/admin">
            <Logo />
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-xs text-zinc-500 hover:text-white"
              >
                <Icon className="size-3.5" />
                {label}
              </Link>
            ))}
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full px-3 py-2 text-xs text-zinc-500 hover:text-white"
            >
              <ExternalLink className="size-3.5" />
              前台
            </Link>
            <AccountMenu variant="admin" />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
