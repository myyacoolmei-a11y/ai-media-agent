import type { Metadata } from "next";

import { ProjectCreateForm } from "@/components/project-create-form";

export const metadata: Metadata = {
  title: "建立新專案",
};

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-10">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-lime-300">
          New project
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
          建立內容專案
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          給專案一個名稱並上傳影片，AI 會接手完成其餘工作。
        </p>
      </div>
      <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
        <ProjectCreateForm />
      </div>
      <p className="mt-6 text-center text-[11px] text-zinc-700">
        目前為 MVP Mock Flow，不會將檔案傳送到外部 AI。
      </p>
    </div>
  );
}
