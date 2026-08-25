"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type GalleryItem = {
  url?: string;
  caption?: string;
  alt?: string;
  source?: string;
};

export function GalleryLightbox({
  items,
  className,
  carousel = false,
}: {
  items: GalleryItem[];
  className?: string;
  carousel?: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const startX = useRef(0);
  const current = openIndex === null ? null : items[openIndex];

  function go(delta: number) {
    setOpenIndex((index) => {
      if (index === null) return 0;
      return (index + delta + items.length) % items.length;
    });
  }

  useEffect(() => {
    if (openIndex === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenIndex(null);
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [items.length, openIndex]);

  if (!items.length) return null;

  return (
    <>
      <div className={className}>
        {items.map((item, index) => (
          <button
            key={`${item.url}-${index}`}
            type="button"
            className={cn(
              "block text-left",
              carousel ? "min-w-[80%] shrink-0 snap-start sm:min-w-[45%]" : "w-full",
            )}
            onClick={() => setOpenIndex(index)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.alt || item.caption || ""}
              loading="lazy"
              className="h-auto w-full rounded-xl"
            />
            {item.caption || item.source ? (
              <span className="mt-2 block text-[11px] leading-5 text-zinc-500">
                {item.caption}
                {item.source ? ` · ${item.source}` : ""}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      {current?.url ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4"
          onClick={() => setOpenIndex(null)}
          onTouchStart={(event) => {
            startX.current = event.changedTouches[0]?.clientX ?? 0;
          }}
          onTouchEnd={(event) => {
            const dx = (event.changedTouches[0]?.clientX ?? 0) - startX.current;
            if (dx > 40) go(-1);
            if (dx < -40) go(1);
          }}
        >
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>
              {openIndex! + 1} / {items.length}
            </span>
            <button type="button" onClick={() => setOpenIndex(null)}>
              關閉
            </button>
          </div>
          <div
            className="flex min-h-0 flex-1 items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.url}
              alt={current.alt || current.caption || ""}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          {current.caption ? (
            <p className="mt-3 text-center text-sm text-zinc-300">{current.caption}</p>
          ) : null}
          <div className="mt-3 flex justify-center gap-3">
            <button
              type="button"
              className="rounded-full border border-white/15 px-4 py-2 text-xs"
              onClick={(event) => {
                event.stopPropagation();
                go(-1);
              }}
            >
              上一張
            </button>
            <button
              type="button"
              className="rounded-full border border-white/15 px-4 py-2 text-xs"
              onClick={(event) => {
                event.stopPropagation();
                go(1);
              }}
            >
              下一張
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
