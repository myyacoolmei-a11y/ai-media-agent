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
    let cancelled = false;

    async function load() {
      try {
        const preview = (await fetch("/api/preview-login").then((response) =>
          response.json(),
        )) as { enabled?: boolean; authenticated?: boolean; email?: string | null };
        if (cancelled) return;
        if (preview.enabled && preview.authenticated) {
          setEmail(preview.email ?? "preview@ai-media.local");
          setLoaded(true);
          return;
        }
      } catch {
        // Fall through to Supabase session.
      }

      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!cancelled) {
          setEmail(data.user?.email ?? null);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setEmail(null);
          setLoaded(true);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    await fetch("/api/preview-login", { method: "DELETE" }).catch(() => undefined);
    try {
      await createClient().auth.signOut();
    } catch {
      // Preview 沒有真實 Supabase session。
    }
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
