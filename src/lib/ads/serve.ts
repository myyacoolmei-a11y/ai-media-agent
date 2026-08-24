import { isMissingRelation } from "@/lib/db/missing";
import { signMediaPath } from "@/lib/media/sign";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdPlacementKey, ServedAd } from "@/types/ads";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isLiveCampaign(row: {
  status: string;
  start_date: string;
  end_date: string;
}) {
  if (row.status !== "active") return false;
  const today = todayIsoDate();
  return row.start_date <= today && row.end_date >= today;
}

function pickByRotation<T extends { priority: number; rotation_mode?: string }>(
  items: T[],
): T | null {
  if (!items.length) return null;
  const random = items.some((item) => item.rotation_mode === "random");
  if (random) {
    const total = items.reduce((sum, item) => sum + Math.max(item.priority, 1), 0);
    let cursor = Math.random() * total;
    for (const item of items) {
      cursor -= Math.max(item.priority, 1);
      if (cursor <= 0) return item;
    }
    return items[items.length - 1];
  }
  return [...items].sort((a, b) => b.priority - a.priority)[0];
}

async function resolveImage(creative: {
  image_url: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
} | null) {
  if (!creative) return null;
  if (creative.storage_bucket && creative.storage_path) {
    return signMediaPath(creative.storage_bucket, creative.storage_path, 1200);
  }
  return creative.image_url;
}

export async function getAdsForPlacement(
  placementKey: AdPlacementKey | string,
  limit = 1,
): Promise<ServedAd[]> {
  try {
    const supabase = createAdminClient();
    const { data: placement, error: placementError } = await supabase
      .from("ad_placements")
      .select("id,key")
      .eq("key", placementKey)
      .maybeSingle();
    if (placementError) {
      if (isMissingRelation(placementError)) return [];
      console.error("Failed to load placement", placementError.message);
      return [];
    }
    if (!placement) return [];

    const { data: assignments, error: assignError } = await supabase
      .from("ad_campaign_placements")
      .select("campaign_id,creative_id,rotation_mode")
      .eq("placement_id", placement.id);
    if (assignError) {
      if (isMissingRelation(assignError)) return [];
      console.error("Failed to load ad assignments", assignError.message);
      return [];
    }
    const campaignIds = [...new Set((assignments ?? []).map((row) => row.campaign_id))];
    if (!campaignIds.length) return [];

    const [{ data: campaigns }, { data: creatives }, { data: advertisers }] =
      await Promise.all([
        supabase
          .from("ad_campaigns")
          .select("id,name,status,start_date,end_date,priority,target_url,advertiser_id")
          .in("id", campaignIds),
        supabase
          .from("ad_creatives")
          .select("*")
          .in("campaign_id", campaignIds),
        supabase.from("advertisers").select("id,name,logo"),
      ]);

    const advertiserMap = new Map(
      (advertisers ?? []).map((row) => [row.id, row]),
    );
    const creativesByCampaign = new Map<string, typeof creatives>();
    for (const creative of creatives ?? []) {
      const list = creativesByCampaign.get(creative.campaign_id) ?? [];
      list.push(creative);
      creativesByCampaign.set(creative.campaign_id, list);
    }

    const eligible = (assignments ?? [])
      .map((assignment) => {
        const campaign = (campaigns ?? []).find(
          (item) => item.id === assignment.campaign_id,
        );
        if (!campaign || !isLiveCampaign(campaign)) return null;
        const list = creativesByCampaign.get(campaign.id) ?? [];
        const creative =
          list.find((item) => item.id === assignment.creative_id) ?? list[0] ?? null;
        return {
          rotation_mode: assignment.rotation_mode as string,
          priority: campaign.priority as number,
          campaign,
          creative,
          advertiser: advertiserMap.get(campaign.advertiser_id) ?? null,
        };
      })
      .filter(Boolean) as Array<{
      rotation_mode: string;
      priority: number;
      campaign: {
        id: string;
        name: string;
        target_url: string | null;
        advertiser_id: string;
      };
      creative: {
        id: string;
        headline: string;
        description: string;
        cta_text: string;
        image_url: string | null;
        video_url: string | null;
        storage_bucket: string | null;
        storage_path: string | null;
        target_url: string | null;
      } | null;
      advertiser: { name: string; logo: string | null } | null;
    }>;

    if (!eligible.length) return [];

    const selected: typeof eligible = [];
    const pool = [...eligible];
    const count = Math.min(limit, pool.length);
    for (let index = 0; index < count; index += 1) {
      const next = pickByRotation(pool);
      if (!next) break;
      selected.push(next);
      const removeAt = pool.findIndex((item) => item.campaign.id === next.campaign.id);
      if (removeAt >= 0) pool.splice(removeAt, 1);
    }

    return Promise.all(
      selected.map(async (item) => ({
        campaignId: item.campaign.id,
        campaignName: item.campaign.name,
        creativeId: item.creative?.id ?? null,
        placementKey: placement.key,
        placementId: placement.id,
        headline: item.creative?.headline || item.campaign.name,
        description: item.creative?.description || "",
        ctaText: item.creative?.cta_text || "了解更多",
        imageUrl: (await resolveImage(item.creative)) ?? item.advertiser?.logo ?? null,
        videoUrl: item.creative?.video_url ?? null,
        targetUrl: item.creative?.target_url || item.campaign.target_url || null,
        advertiserName: item.advertiser?.name ?? "",
        advertiserLogo: item.advertiser?.logo ?? null,
        label: placementKey === "sponsor" ? "合作品牌" : "ADVERTISEMENT",
      })),
    );
  } catch (error) {
    console.error("Failed to load ads", error);
    return [];
  }
}

export async function getAdStats() {
  const supabase = createAdminClient();
  const { data: campaigns, error: campaignError } = await supabase
    .from("ad_campaigns")
    .select("id,name")
    .order("created_at", { ascending: false })
    .limit(80);
  if (campaignError) {
    if (isMissingRelation(campaignError)) return [];
    throw new Error(campaignError.message);
  }
  const ids = (campaigns ?? []).map((row) => row.id);
  if (!ids.length) return [];
  const { data: events, error } = await supabase
    .from("ad_events")
    .select("campaign_id,event_type")
    .in("campaign_id", ids);
  if (error) {
    if (isMissingRelation(error)) return [];
    throw new Error(error.message);
  }
  return (campaigns ?? []).map((campaign) => {
    const rows = (events ?? []).filter((event) => event.campaign_id === campaign.id);
    const impressions = rows.filter((row) => row.event_type === "impression").length;
    const clicks = rows.filter((row) => row.event_type === "click").length;
    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      impressions,
      clicks,
      ctr: impressions ? clicks / impressions : 0,
    };
  });
}
