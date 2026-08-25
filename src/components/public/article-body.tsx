import type { PublicArticleBlock } from "@/lib/content/article-blocks";

export function ArticleBody({
  blocks,
  title,
}: {
  blocks: PublicArticleBlock[];
  title: string;
}) {
  if (!blocks.length) return null;

  return (
    <div className="mt-12 space-y-8 border-t border-white/[0.07] pt-10">
      {blocks.map((block, index) => {
        if (block.type === "text") {
          if (!block.data.text.trim()) return null;
          return (
            <div
              key={`text-${index}`}
              className="whitespace-pre-wrap text-base leading-9 text-zinc-300"
            >
              {block.data.text}
            </div>
          );
        }
        if (!block.data.url) return null;
        return (
          <figure key={`image-${index}`} className="overflow-hidden">
            {/* Signed storage URLs cannot use next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.data.url}
              alt={block.data.caption || title}
              className="h-auto w-full max-w-full object-contain"
            />
            {block.data.caption ? (
              <figcaption className="mt-3 text-center text-sm leading-6 text-zinc-500">
                {block.data.caption}
              </figcaption>
            ) : null}
          </figure>
        );
      })}
    </div>
  );
}
