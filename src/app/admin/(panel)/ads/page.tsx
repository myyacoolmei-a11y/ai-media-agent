import { AdsManager } from "@/components/admin/ads-manager";
import { getAdStats } from "@/lib/ads/serve";
import { getAuthenticatedUser } from "@/lib/jobs/access";
import { isMissingRelation } from "@/lib/db/missing";
import { isPreviewDemo } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function AdsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?next=/admin/ads");

  let advertisers: never[] | Awaited<ReturnType<typeof loadAds>>["advertisers"] = [];
  let campaigns: Awaited<ReturnType<typeof loadAds>>["campaigns"] = [];
  let creatives: Awaited<ReturnType<typeof loadAds>>["creatives"] = [];
  let placements: Awaited<ReturnType<typeof loadAds>>["placements"] = [];
  let stats: Awaited<ReturnType<typeof getAdStats>> = [];

  if (!isPreviewDemo()) {
    const loaded = await loadAds();
    advertisers = loaded.advertisers;
    campaigns = loaded.campaigns;
    creatives = loaded.creatives;
    placements = loaded.placements;
    stats = await getAdStats();
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-[-0.045em]">廣告管理</h1>
      <p className="mt-3 text-sm text-zinc-500">
        管理廣告主、活動、素材、A1–A8 版位與曝光／點擊成效。過期活動會自動停止前台顯示。
      </p>
      <div className="mt-8">
        <AdsManager
          advertisers={advertisers}
          campaigns={campaigns}
          creatives={creatives}
          placements={placements}
          stats={stats}
        />
      </div>
    </div>
  );
}

async function loadAds() {
  const supabase = createAdminClient();
  const [advertisers, campaigns, creatives, placements] = await Promise.all([
    supabase.from("advertisers").select("*").order("created_at", { ascending: false }),
    supabase
      .from("ad_campaigns")
      .select("*, advertisers(name), ad_campaign_placements(placement_id, rotation_mode, ad_placements(key,code,name))")
      .order("created_at", { ascending: false }),
    supabase.from("ad_creatives").select("*").order("created_at", { ascending: false }),
    supabase.from("ad_placements").select("*").order("code", { ascending: true }),
  ]);
  const missing = [advertisers.error, campaigns.error, creatives.error, placements.error].find(
    (error) => error && !isMissingRelation(error),
  );
  if (missing) throw new Error(missing.message);
  return {
    advertisers: advertisers.error ? [] : (advertisers.data ?? []),
    campaigns: campaigns.error ? [] : (campaigns.data ?? []),
    creatives: creatives.error ? [] : (creatives.data ?? []),
    placements: placements.error ? [] : (placements.data ?? []),
  };
}
