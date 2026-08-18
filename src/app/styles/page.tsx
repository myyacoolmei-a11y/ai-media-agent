import { ArrowRight, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { requireBrandContext } from "@/lib/brands/access";
import { isPreviewDemo } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";
import type { BrandStyleProfile } from "@/types/style";

export default async function StylesPage() {
  const context = await requireBrandContext();
  if (!context) redirect("/login?next=/styles");

  let styles: BrandStyleProfile[] = [];
  if (!isPreviewDemo()) {
    const { data } = await createAdminClient()
      .from("brand_style_profiles")
      .select("*")
      .eq("brand_id", context.brand.id)
      .order("updated_at", { ascending: false });
    styles = (data ?? []) as BrandStyleProfile[];
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#d3b176]">
            Personal style system
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">
            我的品牌風格
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
            為不同內容情境建立多套風格，讓每次產出都更接近你。
          </p>
        </div>
        <Link href="/styles/new" className={buttonVariants()}>
          <Plus className="size-4" />
          建立新風格
        </Link>
      </div>

      {styles.length ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {styles.map((style) => (
            <Link
              key={style.id}
              href={`/styles/${style.id}`}
              className="group flex min-h-60 flex-col rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-6 transition hover:-translate-y-1 hover:border-[#deb5bb]/25"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-[#deb5bb]/10 text-[#e2b8bd]">
                <Sparkles className="size-4" />
              </span>
              <div className="mt-auto pt-10">
                <h2 className="text-lg font-medium text-white">
                  {style.style_name}
                </h2>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">
                  {style.brand_description}
                </p>
                <span className="mt-5 flex items-center gap-1.5 text-xs text-zinc-600 transition group-hover:text-[#e2b8bd]">
                  查看與養成
                  <ArrowRight className="size-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-[28px] border border-dashed border-white/10 p-10 text-center">
          <Sparkles className="mx-auto size-6 text-[#d3b176]" />
          <h2 className="mt-4 text-lg font-medium text-white">
            建立你的第一套風格
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
            完成後，每個新專案都會先讀取你選擇的風格。
          </p>
          <Link
            href="/styles/new"
            className={cn(buttonVariants(), "mt-6")}
          >
            建立我的風格
          </Link>
        </div>
      )}
    </div>
  );
}
