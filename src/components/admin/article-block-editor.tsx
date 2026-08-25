"use client";

import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  MAX_ARTICLE_IMAGE_BLOCKS,
  countImageBlocks,
  emptyImageBlock,
  emptyTextBlock,
  moveArticleBlock,
  type ArticleBlock,
} from "@/lib/content/article-blocks";

export function ArticleBlockEditor({
  blocks,
  onChange,
  onUploadImage,
  disabled,
  uploadingId,
}: {
  blocks: ArticleBlock[];
  onChange: (blocks: ArticleBlock[]) => void;
  onUploadImage: (blockId: string, file: File) => Promise<void> | void;
  disabled?: boolean;
  uploadingId?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const targetId = useRef("");
  const imageCount = countImageBlocks(blocks);
  const atImageLimit = imageCount >= MAX_ARTICLE_IMAGE_BLOCKS;

  function updateBlock(blockId: string, patch: ArticleBlock) {
    onChange(blocks.map((block) => (block.id === blockId ? patch : block)));
  }

  function addText() {
    onChange([...blocks, emptyTextBlock()]);
  }

  function addImage() {
    if (atImageLimit) return;
    onChange([...blocks, emptyImageBlock()]);
  }

  function removeBlock(blockId: string) {
    if (blocks.length <= 1) {
      onChange([emptyTextBlock()]);
      return;
    }
    onChange(blocks.filter((block) => block.id !== blockId));
  }

  function pickImage(blockId: string) {
    targetId.current = blockId;
    if (fileRef.current) fileRef.current.value = "";
    fileRef.current?.click();
  }

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <span className="text-xs text-zinc-400">文章內容</span>
        <span className="text-[11px] text-zinc-600">
          內文圖片 {imageCount}/{MAX_ARTICLE_IMAGE_BLOCKS}
        </span>
      </div>

      <div className="space-y-4">
        {blocks.map((block, index) => (
          <article
            key={block.id}
            className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-zinc-500">
                {block.type === "text" ? `文字 ${index + 1}` : `圖片 ${index + 1}`}
              </p>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={disabled || index === 0}
                  onClick={() => onChange(moveArticleBlock(blocks, block.id, -1))}
                >
                  <ChevronUp className="size-3.5" />
                  上移
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={disabled || index === blocks.length - 1}
                  onClick={() => onChange(moveArticleBlock(blocks, block.id, 1))}
                >
                  <ChevronDown className="size-3.5" />
                  下移
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => removeBlock(block.id)}
                >
                  <Trash2 className="size-3.5" />
                  刪除
                </Button>
              </div>
            </div>

            {block.type === "text" ? (
              <textarea
                rows={8}
                value={block.data.text}
                disabled={disabled}
                onChange={(event) =>
                  updateBlock(block.id, {
                    ...block,
                    data: { text: event.target.value },
                  })
                }
                className="editor-input mt-3 min-h-40 resize-y leading-8"
                placeholder="文字段落"
              />
            ) : (
              <div className="mt-3 space-y-3">
                {block.data.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={block.data.url}
                    alt={block.data.caption || "內文圖片"}
                    className="h-auto w-full max-w-full rounded-2xl object-contain"
                  />
                ) : (
                  <button
                    type="button"
                    disabled={disabled || uploadingId === block.id}
                    onClick={() => pickImage(block.id)}
                    className="grid aspect-video w-full place-items-center rounded-2xl border border-dashed border-white/10 text-zinc-600"
                  >
                    {uploadingId === block.id ? (
                      <LoaderCircle className="size-5 animate-spin" />
                    ) : (
                      <ImagePlus className="size-5" />
                    )}
                  </button>
                )}
                <input
                  value={block.data.caption}
                  disabled={disabled}
                  onChange={(event) =>
                    updateBlock(block.id, {
                      ...block,
                      data: { ...block.data, caption: event.target.value },
                    })
                  }
                  placeholder="圖片說明 Caption"
                  className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-[#deb5bb]/40"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={disabled || uploadingId === block.id}
                  onClick={() => pickImage(block.id)}
                >
                  {uploadingId === block.id ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="size-3.5" />
                  )}
                  {block.data.url ? "更換圖片" : "上傳圖片"}
                </Button>
              </div>
            )}
          </article>
        ))}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          const blockId = targetId.current;
          event.target.value = "";
          if (file && blockId) void onUploadImage(blockId, file);
        }}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled}
          onClick={addText}
        >
          ＋ 文字
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled || atImageLimit}
          onClick={addImage}
        >
          ＋ 圖片
        </Button>
      </div>
      {atImageLimit ? (
        <p className="mt-2 text-[11px] text-zinc-600">
          一篇文章最多 {MAX_ARTICLE_IMAGE_BLOCKS} 張內文圖片。
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-zinc-600">
          可在文字段落中間插入多張圖片。封面仍只能 1 張。
        </p>
      )}
    </section>
  );
}
