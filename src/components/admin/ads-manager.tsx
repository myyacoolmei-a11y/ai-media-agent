"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { AdPlacement, AdStatsRow, Advertiser } from "@/types/ads";
import { AD_PLACEMENT_KEYS } from "@/types/ads";

type CampaignRow = {
  id: string;
  name: string;
  advertiser_id: string;
  start_date: string;
  end_date: string;
  status: string;
  priority: number;
  target_url: string | null;
  advertisers?: { name?: string } | { name?: string }[] | null;
  ad_campaign_placements?: Array<{
    ad_placements?: { key?: string; code?: string; name?: string } | Array<{ key?: string; code?: string; name?: string }>;
  }>;
};

type CreativeRow = {
  id: string;
  campaign_id: string;
  headline: string;
  type: string;
  image_url: string | null;
};

const tabs = [
  ["advertisers", "廣告主"],
  ["campaigns", "廣告活動"],
  ["creatives", "廣告素材"],
  ["placements", "廣告版位"],
  ["stats", "成效統計"],
] as const;

function unwrapName(value: CampaignRow["advertisers"]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0]?.name ?? "" : value.name ?? "";
}

export function AdsManager({
  advertisers,
  campaigns,
  creatives,
  placements,
  stats,
}: {
  advertisers: Advertiser[];
  campaigns: CampaignRow[];
  creatives: CreativeRow[];
  placements: AdPlacement[];
  stats: AdStatsRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof tabs)[number][0]>("advertisers");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [advertiserName, setAdvertiserName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [campaignAdvertiser, setCampaignAdvertiser] = useState(advertisers[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priority, setPriority] = useState("1");
  const [status, setStatus] = useState("active");
  const [targetUrl, setTargetUrl] = useState("");
  const [rotation, setRotation] = useState("priority");
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>(["homepage_hero"]);
  const [creativeCampaign, setCreativeCampaign] = useState(campaigns[0]?.id ?? "");
  const [headline, setHeadline] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [cta, setCta] = useState("了解更多");

  const placementList = placements.length
    ? placements
    : AD_PLACEMENT_KEYS.map((key, index) => ({
        id: key,
        code: `A${index + 1}`,
        key,
        name: key,
        description: "",
        width: null,
        height: null,
      }));

  async function save(url: string, body: unknown, method: "POST" | "PATCH" = "POST") {
    setSaving(true);
    setError("");
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(payload.error ?? "儲存失敗。");
      return;
    }
    router.refresh();
  }

  function post(url: string, body: unknown) {
    return save(url, body, "POST");
  }

  function patch(url: string, body: unknown) {
    return save(url, body, "PATCH");
  }

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto rounded-full border border-white/[0.07] p-1">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs ${
              tab === key ? "bg-white/10 text-white" : "text-zinc-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      {tab === "advertisers" ? (
        <section className="mt-8 space-y-4">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              void post("/api/ads/advertisers", {
                name: advertiserName,
                contactName,
                phone,
                email,
                website: website || null,
              });
              setAdvertiserName("");
              setContactName("");
              setPhone("");
              setEmail("");
              setWebsite("");
            }}
          >
            <input
              value={advertiserName}
              onChange={(event) => setAdvertiserName(event.target.value)}
              placeholder="廣告主名稱"
              className="editor-input"
              required
            />
            <input
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              placeholder="聯絡人"
              className="editor-input"
            />
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="電話"
              className="editor-input"
            />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="editor-input"
            />
            <input
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="網站"
              className="editor-input sm:col-span-2"
            />
            <Button type="submit" size="sm" disabled={saving}>
              新增
            </Button>
          </form>
          {advertisers.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/[0.07] px-4 py-3 text-sm">
              <p>{item.name}</p>
              {item.contact_name || item.email ? (
                <p className="mt-1 text-[11px] text-zinc-600">
                  {[item.contact_name, item.email, item.phone].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {tab === "campaigns" ? (
        <section className="mt-8 space-y-4">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              void post("/api/ads/campaigns", {
                advertiserId: campaignAdvertiser,
                name: campaignName,
                startDate,
                endDate,
                status,
                priority: Number(priority) || 0,
                targetUrl,
                placementKeys: selectedPlacements,
                rotationMode: rotation,
              });
              setCampaignName("");
            }}
          >
            <input
              value={campaignName}
              onChange={(event) => setCampaignName(event.target.value)}
              placeholder="活動名稱"
              className="editor-input"
              required
            />
            <select
              value={campaignAdvertiser}
              onChange={(event) => setCampaignAdvertiser(event.target.value)}
              className="editor-input"
            >
              {advertisers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="editor-input" required />
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="editor-input" required />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="editor-input">
              <option value="draft">draft</option>
              <option value="scheduled">scheduled</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="ended">ended</option>
            </select>
            <input
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              placeholder="priority"
              className="editor-input"
            />
            <input
              value={targetUrl}
              onChange={(event) => setTargetUrl(event.target.value)}
              placeholder="目標網址"
              className="editor-input sm:col-span-2"
            />
            <select value={rotation} onChange={(event) => setRotation(event.target.value)} className="editor-input">
              <option value="priority">依 priority</option>
              <option value="random">隨機輪替</option>
            </select>
            <div className="sm:col-span-2 flex flex-wrap gap-2 text-xs">
              {placementList.map((placement) => {
                const active = selectedPlacements.includes(placement.key);
                return (
                  <button
                    key={placement.key}
                    type="button"
                    onClick={() =>
                      setSelectedPlacements((current) =>
                        active
                          ? current.filter((key) => key !== placement.key)
                          : [...current, placement.key],
                      )
                    }
                    className={`rounded-full px-3 py-1 ${active ? "bg-[#d3b176]/20 text-[#d3b176]" : "bg-white/5 text-zinc-500"}`}
                  >
                    {placement.code} {placement.name}
                  </button>
                );
              })}
            </div>
            <Button type="submit" size="sm" disabled={saving || !advertisers.length}>
              新增活動
            </Button>
          </form>
          {campaigns.map((item) => {
            const expired = item.end_date < today;
            return (
              <div key={item.id} className="rounded-2xl border border-white/[0.07] px-4 py-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p>{item.name}</p>
                    <p className="mt-1 text-[11px] text-zinc-600">
                      {unwrapName(item.advertisers)} · {item.status} · {item.start_date} → {item.end_date}
                      {expired ? " · 已過期不顯示" : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={saving}
                    onClick={() =>
                      void patch(`/api/ads/campaigns/${item.id}`, {
                        status: item.status === "paused" ? "active" : "paused",
                      })
                    }
                  >
                    {item.status === "paused" ? "啟用" : "暫停"}
                  </Button>
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

      {tab === "creatives" ? (
        <section className="mt-8 space-y-4">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              void post("/api/ads/creatives", {
                campaignId: creativeCampaign,
                headline,
                description,
                imageUrl,
                ctaText: cta,
                targetUrl,
              });
              setHeadline("");
              setImageUrl("");
              setDescription("");
            }}
          >
            <select
              value={creativeCampaign}
              onChange={(event) => setCreativeCampaign(event.target.value)}
              className="editor-input"
            >
              {campaigns.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <input value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder="標題" className="editor-input" />
            <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="介紹／說明" className="editor-input sm:col-span-2" />
            <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="圖片網址" className="editor-input sm:col-span-2" />
            <input value={cta} onChange={(event) => setCta(event.target.value)} placeholder="CTA" className="editor-input" />
            <Button type="submit" size="sm" disabled={saving || !campaigns.length}>
              新增素材
            </Button>
          </form>
          {creatives.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/[0.07] px-4 py-3 text-sm">
              {item.headline || "未命名素材"} · {item.type}
            </div>
          ))}
        </section>
      ) : null}

      {tab === "placements" ? (
        <section className="mt-8 space-y-3">
          {placementList.map((placement) => (
            <div key={placement.key} className="rounded-2xl border border-white/[0.07] px-4 py-3">
              <p className="text-sm">
                {placement.code} · {placement.name}
              </p>
              <p className="mt-1 text-[11px] text-zinc-600">
                {placement.key}
                {placement.width ? ` · ${placement.width}×${placement.height}` : ""}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-zinc-500">{placement.description}</p>
            </div>
          ))}
        </section>
      ) : null}

      {tab === "stats" ? (
        <section className="mt-8 overflow-hidden rounded-2xl border border-white/[0.07]">
          <div className="grid grid-cols-4 border-b border-white/[0.06] px-4 py-3 text-[11px] text-zinc-500">
            <span>活動</span>
            <span>曝光</span>
            <span>點擊</span>
            <span>CTR</span>
          </div>
          {stats.map((row) => (
            <div key={row.campaignId} className="grid grid-cols-4 px-4 py-3 text-sm">
              <span>{row.campaignName}</span>
              <span>{row.impressions}</span>
              <span>{row.clicks}</span>
              <span>{(row.ctr * 100).toFixed(1)}%</span>
            </div>
          ))}
          {!stats.length ? (
            <p className="px-4 py-8 text-sm text-zinc-600">還沒有曝光或點擊紀錄。</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
