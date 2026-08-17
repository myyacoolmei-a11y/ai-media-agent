import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProjectCreateForm } from "@/components/project-create-form";
import { getAuthenticatedUser } from "@/lib/jobs/access";
import { getProviderStatus } from "@/lib/providers/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BrandStyleProfile } from "@/types/style";

export const metadata: Metadata = {
  title: "AI 報導助手",
};

type NewAssistantPageProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function NewAssistantPage({
  searchParams,
}: NewAssistantPageProps) {
  const { type } = await searchParams;
  const initialType =
    type === "photos" || type === "audio" || type === "video" ? type : "video";
  const providerStatus = getProviderStatus();
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?next=/admin/assistant/new");
  const { data } = await createAdminClient()
    .from("brand_style_profiles")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  const brandStyles = (data ?? []) as BrandStyleProfile[];
  if (!brandStyles.length) redirect("/styles/new");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#d3b176]">
          AI 報導助手
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
          開始製作報導
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          上傳影片後，系統會進行語音辨識、畫面分析，並產出標題、文案、SEO 與
          Hashtag。完成後再進內容管理發布。
        </p>
      </div>
      <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
        <ProjectCreateForm
          initialType={initialType}
          providerStatus={providerStatus}
          brandStyles={brandStyles}
        />
      </div>
    </div>
  );
}
