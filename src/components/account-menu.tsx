"use client";

import { LayoutDashboard, LogIn, LogOut, Palette } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function AccountMenu({
  variant = "public",
}: {
  variant?: "public" | "admin";
}) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoaded(true);
    });
  }, []);

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  if (!loaded) return <span className="size-9" />;

  if (!email) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 rounded-full px-3 py-2 text-xs text-zinc-500 transition hover:text-white"
      >
        <LogIn className="size-3.5" />
        <span className="hidden sm:inline">登入</span>
      </Link>
    );
  }

  return (
    <>
      {variant === "public" ? (
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-full px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
        >
          <LayoutDashboard className="size-3.5" />
          <span className="hidden sm:inline">後台</span>
        </Link>
      ) : (
        <Link
          href="/styles"
          className="flex items-center gap-2 rounded-full px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
        >
          <Palette className="size-3.5" />
          <span className="hidden sm:inline">品牌風格</span>
        </Link>
      )}
      <button
        type="button"
        onClick={logout}
        title={`登出 ${email}`}
        className="grid size-9 place-items-center rounded-full text-zinc-600 transition hover:bg-white/[0.04] hover:text-white"
      >
        <LogOut className="size-3.5" />
      </button>
    </>
  );
}
