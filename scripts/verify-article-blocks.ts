import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ArticleBody } from "../src/components/public/article-body.tsx";

import {
  MAX_ARTICLE_IMAGE_BLOCKS,
  MAX_ARTICLE_IMAGE_BLOCKS_MESSAGE,
  blocksToPlainText,
  countImageBlocks,
  emptyImageBlock,
  emptyTextBlock,
  hydrateArticleBlocks,
  hydrateArticleBlocksFromContent,
  moveArticleBlock,
  toPublicArticleBlocks,
  toStoredArticleBlocks,
  withoutCoverImageBlocks,
} from "../src/lib/content/article-blocks.ts";
import type { ContentAsset } from "../src/types/content.ts";

function asset(id: string, url: string): ContentAsset {
  return {
    id,
    content_item_id: "article-1",
    asset_type: "image",
    status: "ready",
    bucket: "content-media",
    storage_path: `user/article-1/${id}.jpg`,
    file_name: `${id}.jpg`,
    mime_type: "image/jpeg",
    size_bytes: 12,
    width: 1200,
    height: 800,
    duration_seconds: null,
    alt_text: "",
    sort_order: 0,
    signed_url: url,
  };
}

const cover = asset(
  "11111111-1111-4111-8111-111111111111",
  "https://cdn.example/cover.jpg",
);
const body = [
  "21111111-1111-4111-8111-111111111111",
  "22111111-1111-4111-8111-111111111111",
  "23111111-1111-4111-8111-111111111111",
  "24111111-1111-4111-8111-111111111111",
  "25111111-1111-4111-8111-111111111111",
].map((id, index) =>
  asset(id, `https://cdn.example/body-${index + 1}.jpg`),
);

const draft = [
  emptyTextBlock("第一段文字"),
  {
    ...emptyImageBlock(),
    data: { url: body[0].signed_url ?? "", caption: "圖說一", assetId: body[0].id },
  },
  emptyTextBlock("第二段文字"),
  {
    ...emptyImageBlock(),
    data: { url: body[1].signed_url ?? "", caption: "圖說二", assetId: body[1].id },
  },
  {
    ...emptyImageBlock(),
    data: { url: body[2].signed_url ?? "", caption: "圖說三", assetId: body[2].id },
  },
  emptyTextBlock("第三段文字"),
  {
    ...emptyImageBlock(),
    data: { url: body[3].signed_url ?? "", caption: "圖說四", assetId: body[3].id },
  },
  {
    ...emptyImageBlock(),
    data: { url: body[4].signed_url ?? "", caption: "圖說五", assetId: body[4].id },
  },
];

assert.equal(countImageBlocks(draft), 5);
assert.equal(blocksToPlainText(draft), "第一段文字\n\n第二段文字\n\n第三段文字");

const stored = toStoredArticleBlocks(draft);
assert.equal(countImageBlocks(stored), 5);
for (const block of stored) {
  if (block.type === "image") {
    assert.equal(block.data.url, "", "body images must not persist signed URLs");
    assert.ok(block.data.assetId);
  }
}
assert.ok(
  !stored.some(
    (block) => block.type === "image" && block.data.assetId === cover.id,
  ),
  "cover asset must not be stored in article_blocks",
);

const reloaded = hydrateArticleBlocks(stored, "should-not-be-used", [
  cover,
  ...body,
]);
assert.equal(reloaded.length, 8);
assert.deepEqual(
  reloaded.filter((block) => block.type === "image").map((block) => {
    if (block.type !== "image") throw new Error("expected image");
    return { url: block.data.url, caption: block.data.caption };
  }),
  [
    { url: "https://cdn.example/body-1.jpg", caption: "圖說一" },
    { url: "https://cdn.example/body-2.jpg", caption: "圖說二" },
    { url: "https://cdn.example/body-3.jpg", caption: "圖說三" },
    { url: "https://cdn.example/body-4.jpg", caption: "圖說四" },
    { url: "https://cdn.example/body-5.jpg", caption: "圖說五" },
  ],
);

const publicBlocks = toPublicArticleBlocks(reloaded);
assert.equal(publicBlocks.filter((block) => block.type === "image").length, 5);
assert.equal(publicBlocks[0]?.type, "text");
assert.equal(publicBlocks[1]?.type, "image");
assert.equal(publicBlocks[2]?.type, "text");
assert.equal(publicBlocks[3]?.type, "image");
assert.equal(publicBlocks[4]?.type, "image");
assert.equal(publicBlocks[5]?.type, "text");

const html = renderToStaticMarkup(
  createElement(ArticleBody, {
    blocks: publicBlocks,
    title: "測試文章：1 封面、3 段文字、5 張內文圖片",
  }),
);
assert.match(html, /第一段文字/);
assert.match(html, /第二段文字/);
assert.match(html, /第三段文字/);
assert.match(html, /圖說一/);
assert.match(html, /圖說五/);
assert.match(html, /body-1\.jpg/);
assert.match(html, /body-5\.jpg/);
assert.match(html, /h-auto w-full max-w-full object-contain/);
assert.doesNotMatch(html, /cover\.jpg/);
assert.match(html, /overflow-hidden/);

const mixedWithCover = [
  ...draft,
  {
    ...emptyImageBlock(),
    data: {
      url: cover.signed_url ?? "",
      caption: "封面誤入內文",
      assetId: cover.id,
    },
  },
];
assert.equal(
  countImageBlocks(withoutCoverImageBlocks(mixedWithCover, cover.id)),
  5,
);
const reloadedWithoutCover = hydrateArticleBlocksFromContent({
  article_blocks: toStoredArticleBlocks(mixedWithCover),
  content: "",
  assets: [cover, ...body],
  cover_asset_id: cover.id,
});
assert.equal(countImageBlocks(reloadedWithoutCover), 5);
assert.ok(
  !reloadedWithoutCover.some(
    (block) => block.type === "image" && block.data.assetId === cover.id,
  ),
);

assert.equal(MAX_ARTICLE_IMAGE_BLOCKS_MESSAGE, "每篇文章最多 20 張內文圖片");
writeFileSync(
  "/tmp/article-body-five-images.html",
  `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>內文 5 圖驗證</title>
  <style>body{margin:0;background:#0a090a;color:#fff;font-family:sans-serif}img{display:block}</style>
  </head><body>${html}</body></html>`,
);

const moved = moveArticleBlock(reloaded, reloaded[3].id, -1);
assert.equal(moved[2]?.type, "image");
assert.equal(moved[3]?.type, "text");

const tooMany = Array.from({ length: MAX_ARTICLE_IMAGE_BLOCKS + 1 }, () =>
  emptyImageBlock(),
);
assert.equal(countImageBlocks(tooMany), 21);
assert.equal(
  countImageBlocks(tooMany) > MAX_ARTICLE_IMAGE_BLOCKS
    ? MAX_ARTICLE_IMAGE_BLOCKS_MESSAGE
    : "",
  MAX_ARTICLE_IMAGE_BLOCKS_MESSAGE,
);

const legacy = hydrateArticleBlocks([], "舊文章純文字", []);
assert.equal(legacy.length, 1);
assert.equal(legacy[0]?.type, "text");
if (legacy[0]?.type === "text") {
  assert.equal(legacy[0].data.text, "舊文章純文字");
}

console.log("article-blocks verification passed");
