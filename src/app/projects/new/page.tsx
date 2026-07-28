import type { Metadata } from "next";

import { ProjectCreateForm } from "@/components/project-create-form";
import { getProviderStatus } from "@/lib/providers/config";

export const metadata: Metadata = {
  title: "開始製作內容",
};

type NewProjectPageProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function NewProjectPage({
  searchParams,
}: NewProjectPageProps) {
  const { type } = await searchParams;
  const initialType =
    type === "photos" || type === "audio" || type === "video" ? type : "video";
  const providerStatus = getProviderStatus();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
          開始製作內容
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          跟著簡單的步驟，告訴我們你想製作什麼。
        </p>
      </div>
      <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
        <ProjectCreateForm
          initialType={initialType}
          providerStatus={providerStatus}
        />
      </div>
    </div>
  );
}
