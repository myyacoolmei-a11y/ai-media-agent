"use client";

import { LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";

export function ArticleCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError("");
    const response = await fetch("/api/contents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug: `article-${Date.now().toString(36)}`,
        summary: "",
        content: "",
        videoUrl: "",
        category: "未分類",
        contentType: "article",
        styleProfileId: null,
      }),
    });
    const payload = (await response.json()) as {
      content?: { id: string };
      error?: string;
    };
    if (!response.ok || !payload.content) {
      setError(payload.error || "無法建立文章。");
      setCreating(false);
      return;
    }
    router.push(`/admin/${payload.content.id}/edit`);
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-xl rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6"
    >
      <label>
        <span className="mb-2 block text-xs text-zinc-400">文章標題</span>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="輸入文章標題"
          className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-[#deb5bb]/40"
        />
      </label>
      {error && <p className="mt-4 text-xs text-red-300">{error}</p>}
      <Button type="submit" className="mt-6 w-full" disabled={creating}>
        {creating ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        建立草稿
      </Button>
    </form>
  );
}
