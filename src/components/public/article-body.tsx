import Link from "next/link";

import { AdSlot } from "@/components/public/ad-slot";
import { parseEmbed } from "@/lib/content/embed";
import { galleryLayoutClass, hasRenderableBlocks } from "@/lib/content/blocks";
import type { ArticleBlock } from "@/types/blocks";
import type { PublicContentItem } from "@/types/content";
import type { ServedAd } from "@/types/ads";

function Gallery({ block }: { block: ArticleBlock }) {
  const layout = String(block.metadata?.layout ?? "gallery");
  const items = Array.isArray(block.metadata?.items)
    ? (block.metadata.items as Array<{
        url?: string;
        caption?: string;
        alt?: string;
        source?: string;
      }>)
    : block.media_url
      ? [{ url: block.media_url, caption: block.caption, alt: block.alt_text, source: block.source }]
      : [];
  if (!items.length) return null;
  return (
    <figure>
      <div className={galleryLayoutClass(layout)}>
        {items.map((item, index) => (
          <div
            key={`${item.url}-${index}`}
            className={layout === "carousel" ? "w-[min(100%,22rem)] shrink-0 snap-start" : ""}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.alt || block.alt_text || ""}
              loading="lazy"
              className="h-auto w-full rounded-xl object-cover"
            />
            {item.caption || item.source ? (
              <figcaption className="mt-2 text-[11px] leading-5 text-zinc-500">
                {item.caption}
                {item.source ? ` · ${item.source}` : ""}
              </figcaption>
            ) : null}
          </div>
        ))}
      </div>
      {block.caption && layout === "single" ? (
        <figcaption className="mt-2 text-[11px] text-zinc-500">{block.caption}</figcaption>
      ) : null}
    </figure>
  );
}

function EmbedBlock({ block }: { block: ArticleBlock }) {
  const url = String(block.metadata?.url ?? block.media_url ?? "");
  const parsed = parseEmbed(url);
  if (!parsed) return null;
  if (parsed.kind === "iframe" && parsed.embedUrl) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          src={parsed.embedUrl}
          title={block.caption || parsed.provider}
          className="size-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; encrypted-media"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <a
      href={parsed.pageUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-sm text-zinc-300 hover:border-white/15"
    >
      開啟外部內容
      <span className="mt-1 block truncate text-xs text-zinc-600">{parsed.pageUrl}</span>
    </a>
  );
}

export function ArticleBody({
  story,
  inlineAds,
}: {
  story: PublicContentItem;
  inlineAds: ServedAd[];
}) {
  const blocks = story.blocks ?? [];
  if (!hasRenderableBlocks(blocks)) {
    return (
      <div className="mt-12 space-y-6 border-t border-white/[0.07] pt-10">
        {story.content ? (
          <div className="whitespace-pre-wrap text-base leading-9 text-zinc-300">
            {story.content}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-8">
      {blocks.map((block, index) => {
        const afterAd =
          (index === 2 || index === 6) && inlineAds.length ? (
            <AdSlot
              ads={inlineAds}
              placementKey="article_inline"
              articleId={undefined}
              className="mt-8"
              variant="feed"
            />
          ) : null;
        return (
          <div key={block.id}>
            <BlockView block={block} story={story} inlineAds={inlineAds} />
            {afterAd}
          </div>
        );
      })}
    </div>
  );
}

function BlockView({
  block,
  story,
  inlineAds,
}: {
  block: ArticleBlock;
  story: PublicContentItem;
  inlineAds: ServedAd[];
}) {
  if (block.type === "heading") {
    return (
      <h2 className="font-[family-name:var(--font-news-serif)] text-2xl tracking-[-0.03em]">
        {block.content}
      </h2>
    );
  }
  if (block.type === "quote") {
    return (
      <blockquote className="border-l-2 border-[#d3b176] pl-5 text-lg leading-8 text-zinc-300">
        {block.content}
      </blockquote>
    );
  }
  if (block.type === "text") {
    return (
      <div className="whitespace-pre-wrap text-base leading-9 text-zinc-300">
        {block.content}
      </div>
    );
  }
  if (block.type === "image") {
    if (!block.media_url) return null;
    return (
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={block.media_url}
          alt={block.alt_text || story.title}
          loading="lazy"
          className="h-auto w-full rounded-2xl object-cover"
        />
        {block.caption || block.source ? (
          <figcaption className="mt-2 text-[11px] leading-5 text-zinc-500">
            {block.caption}
            {block.source ? ` · ${block.source}` : ""}
          </figcaption>
        ) : null}
      </figure>
    );
  }
  if (block.type === "gallery") return <Gallery block={block} />;
  if (block.type === "video") {
    if (!block.media_url) return null;
    return (
      <figure>
        <div className="aspect-video overflow-hidden rounded-2xl bg-black">
          <video
            src={block.media_url}
            poster={block.thumbnail_url ?? undefined}
            controls
            preload="metadata"
            className="size-full"
          />
        </div>
        {block.caption ? (
          <figcaption className="mt-2 text-[11px] text-zinc-500">{block.caption}</figcaption>
        ) : null}
      </figure>
    );
  }
  if (block.type === "embed") return <EmbedBlock block={block} />;
  if (block.type === "ad") {
    return (
      <AdSlot
        ads={inlineAds}
        placementKey="article_inline"
        variant="feed"
      />
    );
  }
  if (block.type === "related_articles") {
    const slugs = Array.isArray(block.metadata?.slugs)
      ? (block.metadata.slugs as string[])
      : String(block.content)
          .split(/\s+/)
          .map((item) => item.trim())
          .filter(Boolean);
    if (!slugs.length) return null;
    return (
      <aside className="rounded-2xl border border-white/[0.08] p-5">
        <p className="text-[10px] tracking-[0.18em] text-[#d3b176]">延伸閱讀</p>
        <div className="mt-3 space-y-2">
          {slugs.map((slug) => (
            <Link key={slug} href={`/article/${slug}`} className="block text-sm text-zinc-300 hover:text-white">
              {slug}
            </Link>
          ))}
        </div>
      </aside>
    );
  }
  return null;
}
