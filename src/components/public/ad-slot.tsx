"use client";

import { useEffect, useRef } from "react";

import type { ServedAd } from "@/types/ads";
import { cn } from "@/lib/utils";

export function AdSlot({
  ads,
  placementKey,
  articleId,
  className,
  variant = "banner",
}: {
  ads: ServedAd[];
  placementKey: string;
  articleId?: string;
  className?: string;
  variant?: "banner" | "sidebar" | "feed" | "sponsor";
}) {
  const recorded = useRef(false);
  const ad = ads[0];

  useEffect(() => {
    if (!ad || recorded.current) return;
    recorded.current = true;
    void fetch("/api/ads/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId: ad.campaignId,
        creativeId: ad.creativeId,
        placementKey,
        articleId,
        eventType: "impression",
      }),
    }).catch(() => undefined);
  }, [ad, articleId, placementKey]);

  if (!ads.length) return null;

  if (variant === "sponsor") {
    return (
      <aside className={cn("rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4", className)}>
        <p className="text-[10px] tracking-[0.18em] text-zinc-600">合作品牌</p>
        <div className="mt-4 space-y-4">
          {ads.map((item) => (
            <SponsorCard key={item.campaignId} ad={item} placementKey={placementKey} articleId={articleId} />
          ))}
        </div>
      </aside>
    );
  }

  if (!ad) return null;
  return (
    <AdCard
      ad={ad}
      placementKey={placementKey}
      articleId={articleId}
      className={className}
      variant={variant}
    />
  );
}

function AdCard({
  ad,
  placementKey,
  articleId,
  className,
  variant,
}: {
  ad: ServedAd;
  placementKey: string;
  articleId?: string;
  className?: string;
  variant: "banner" | "sidebar" | "feed" | "sponsor";
}) {
  async function trackClick() {
    await fetch("/api/ads/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId: ad.campaignId,
        creativeId: ad.creativeId,
        placementKey,
        articleId,
        eventType: "click",
      }),
    }).catch(() => undefined);
  }

  const inner = (
    <>
      <p className="text-[10px] tracking-[0.18em] text-zinc-600">
        {ad.label === "合作品牌" ? "合作品牌" : "ADVERTISEMENT · 廣告"}
      </p>
      {ad.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ad.imageUrl}
          alt={ad.headline}
          loading="lazy"
          className={cn(
            "mt-3 w-full object-cover",
            variant === "sidebar" ? "max-h-[600px]" : "max-h-52 sm:max-h-64",
          )}
        />
      ) : null}
      {ad.headline ? (
        <p className="mt-3 text-sm font-medium text-zinc-200">{ad.headline}</p>
      ) : null}
      {ad.description ? (
        <p className="mt-1 text-xs leading-5 text-zinc-500">{ad.description}</p>
      ) : null}
      {ad.ctaText ? (
        <span className="mt-3 inline-flex text-[11px] tracking-wide text-[#d3b176]">
          {ad.ctaText}
        </span>
      ) : null}
    </>
  );

  const box = cn(
    "block rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4",
    className,
  );

  if (!ad.targetUrl) return <div className={box}>{inner}</div>;
  return (
    <a
      href={ad.targetUrl}
      target="_blank"
      rel="noopener sponsored noreferrer"
      onClick={() => void trackClick()}
      className={cn(box, "hover:border-white/15")}
    >
      {inner}
    </a>
  );
}

function SponsorCard({
  ad,
  placementKey,
  articleId,
}: {
  ad: ServedAd;
  placementKey: string;
  articleId?: string;
}) {
  async function trackClick() {
    await fetch("/api/ads/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId: ad.campaignId,
        creativeId: ad.creativeId,
        placementKey,
        articleId,
        eventType: "click",
      }),
    }).catch(() => undefined);
  }
  const body = (
    <div className="flex items-start gap-3">
      {ad.advertiserLogo || ad.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ad.advertiserLogo || ad.imageUrl || ""}
          alt={ad.advertiserName || ad.headline}
          loading="lazy"
          className="size-12 rounded-xl object-cover"
        />
      ) : null}
      <div className="min-w-0">
        <p className="text-sm text-white">{ad.advertiserName || ad.headline}</p>
        {ad.description ? (
          <p className="mt-1 text-xs leading-5 text-zinc-500">{ad.description}</p>
        ) : null}
      </div>
    </div>
  );
  if (!ad.targetUrl) return body;
  return (
    <a
      href={ad.targetUrl}
      target="_blank"
      rel="noopener sponsored noreferrer"
      onClick={() => void trackClick()}
      className="block hover:opacity-90"
    >
      {body}
    </a>
  );
}
