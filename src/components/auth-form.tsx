"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "forgot" | "reset";

const content = {
  login: {
    title: "歡迎回來",
    description: "登入後繼續使用你的品牌風格與內容紀錄。",
    submit: "登入",
  },
  signup: {
    title: "建立你的專屬剪片師",
    description: "建立帳號，讓 AI 長期記住你的內容風格。",
    submit: "建立帳號",
  },
  forgot: {
    title: "重設密碼",
    description: "輸入註冊 Email，我們會寄送重設連結。",
    submit: "寄送重設連結",
  },
  reset: {
    title: "設定新密碼",
    description: "請為你的帳號設定新的登入密碼。",
    submit: "儲存新密碼",
  },
} satisfies Record<AuthMode, Record<string, string>>;

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(searchParams.get("error") ?? "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const page = content[mode];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if ((mode === "signup" || mode === "reset") && password.length < 8) {
      setError("密碼至少需要 8 個字元。");
      return;
    }
    if ((mode === "signup" || mode === "reset") && password !== confirmPassword) {
      setError("兩次輸入的密碼不一致。");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        const next = searchParams.get("next");
        router.replace(next?.startsWith("/") ? next : "/dashboard");
        router.refresh();
      } else if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/styles/new`,
          },
        });
        if (authError) throw authError;
        if (data.session) {
          router.replace("/styles/new");
          router.refresh();
        } else {
          setMessage("驗證信已寄出。請點擊信中的連結完成 Email 驗證。");
        }
      } else if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
          },
        );
        if (authError) throw authError;
        setMessage("密碼重設信已寄出，請查看你的 Email。");
      } else {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setMessage("密碼已更新，正在返回內容製作頁。");
        window.setTimeout(() => router.replace("/dashboard"), 800);
      }
    } catch (authError) {
      setError(
        authError instanceof Error ? authError.message : "操作失敗，請稍後再試。",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-[-0.045em] text-white">
          {page.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          {page.description}
        </p>
      </div>
      <form
        onSubmit={submit}
        className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8"
      >
        {mode !== "reset" && (
          <label className="block">
            <span className="mb-2 block text-xs text-zinc-400">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#deb5bb]/40"
              placeholder="you@example.com"
            />
          </label>
        )}
        {mode !== "forgot" && (
          <label className={mode === "reset" ? "block" : "mt-5 block"}>
            <span className="mb-2 block text-xs text-zinc-400">
              {mode === "reset" ? "新密碼" : "密碼"}
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-[#deb5bb]/40"
            />
          </label>
        )}
        {(mode === "signup" || mode === "reset") && (
          <label className="mt-5 block">
            <span className="mb-2 block text-xs text-zinc-400">確認密碼</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-[#deb5bb]/40"
            />
          </label>
        )}
        {error && (
          <p className="mt-5 rounded-xl bg-red-300/[0.07] p-3 text-xs leading-5 text-red-200">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-5 rounded-xl bg-[#d3b176]/[0.08] p-3 text-xs leading-5 text-[#e2c995]">
            {message}
          </p>
        )}
        <Button type="submit" className="mt-6 w-full" disabled={loading}>
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : page.submit}
          {!loading && <ArrowRight className="size-4" />}
        </Button>
        {mode === "login" && (
          <div className="mt-5 flex items-center justify-between text-xs">
            <Link href="/forgot-password" className="text-zinc-500 hover:text-white">
              忘記密碼？
            </Link>
            <Link href="/signup" className="text-[#e2b8bd] hover:text-white">
              建立帳號
            </Link>
          </div>
        )}
        {mode === "signup" && (
          <p className="mt-5 text-center text-xs text-zinc-500">
            已有帳號？{" "}
            <Link href="/login" className="text-[#e2b8bd] hover:text-white">
              登入
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
