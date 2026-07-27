"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileVideo2, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { DEMO_PROJECT_ID } from "@/lib/mock-data";
import { cn, formatFileSize } from "@/lib/utils";

const projectSchema = z.object({
  name: z.string().trim().min(2, "請輸入至少 2 個字").max(120),
  description: z.string().trim().max(500).optional(),
});

type ProjectForm = z.infer<typeof projectSchema>;

export function ProjectCreateForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "" },
  });

  function acceptFile(nextFile?: File) {
    if (!nextFile) return;

    if (!nextFile.type.startsWith("video/")) {
      setFileError("第一階段請上傳影片檔案");
      return;
    }

    if (nextFile.size > 500 * 1024 * 1024) {
      setFileError("影片不可超過 500 MB");
      return;
    }

    setFile(nextFile);
    setFileError("");
  }

  async function onSubmit() {
    if (!file) {
      setFileError("請先選擇要分析的影片");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push(`/projects/${DEMO_PROJECT_ID}/processing`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-3">
        <label htmlFor="name" className="text-sm font-medium text-zinc-200">
          專案名稱
        </label>
        <input
          id="name"
          autoFocus
          placeholder="例如：新品發表幕後花絮"
          className="h-13 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-base text-white outline-none transition placeholder:text-zinc-700 focus:border-lime-300/50 focus:ring-4 focus:ring-lime-300/[0.06]"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-red-400">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <label
          htmlFor="description"
          className="text-sm font-medium text-zinc-200"
        >
          內容目標 <span className="font-normal text-zinc-600">選填</span>
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder="希望這支內容傳達什麼？"
          className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-700 focus:border-lime-300/50 focus:ring-4 focus:ring-lime-300/[0.06]"
          {...register("description")}
        />
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium text-zinc-200">上傳影片</span>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="sr-only"
          onChange={(event) => acceptFile(event.target.files?.[0])}
        />
        {file ? (
          <div className="flex items-center gap-4 rounded-2xl border border-lime-300/20 bg-lime-300/[0.04] p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
              <FileVideo2 className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-100">
                {file.name}
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                {formatFileSize(file.size)} · 準備上傳
              </p>
            </div>
            <button
              type="button"
              aria-label="移除影片"
              onClick={() => setFile(null)}
              className="grid size-9 place-items-center rounded-full text-zinc-500 transition hover:bg-white/5 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              acceptFile(event.dataTransfer.files[0]);
            }}
            className={cn(
              "flex min-h-52 w-full flex-col items-center justify-center rounded-3xl border border-dashed bg-white/[0.02] px-6 text-center transition",
              isDragging
                ? "border-lime-300 bg-lime-300/[0.05]"
                : "border-white/15 hover:border-white/30 hover:bg-white/[0.035]",
            )}
          >
            <span className="mb-5 grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <UploadCloud className="size-5 text-lime-300" />
            </span>
            <span className="text-sm font-medium text-zinc-200">
              拖放影片，或點擊選擇檔案
            </span>
            <span className="mt-2 text-xs text-zinc-600">
              MP4、MOV、WebM · 最大 500 MB
            </span>
          </button>
        )}
        {fileError && <p className="text-xs text-red-400">{fileError}</p>}
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.07] pt-6">
        <p className="hidden text-xs text-zinc-600 sm:block">
          上傳後將自動啟動 AI 分析
        </p>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "建立中…" : "建立並開始分析"}
        </Button>
      </div>
    </form>
  );
}
