"use client";

import { ArrowLeft, LoaderCircle, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ContentPreviewActions({ contentId }: { contentId: string }) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  async function publish() {
    setPublishing(true);
    setError("");
    const response = await fetch(`/api/contents/${contentId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error || "發布失敗。");
      setPublishing(false);
      return;
    }
    router.push(`/dashboard/contents/${contentId}/edit`);
    router.refresh();
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/dashboard/contents/${contentId}/edit`}
          className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          返回編輯
        </Link>
        <Button size="sm" onClick={publish} disabled={publishing}>
          {publishing ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          確認發布
        </Button>
      </div>
      {error && <p className="mt-3 text-right text-xs text-red-300">{error}</p>}
    </div>
  );
}
