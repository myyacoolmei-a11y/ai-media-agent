import assert from "node:assert/strict";

import { fitMaxSide, isHeicFile, isLikelyImageFile } from "../src/lib/media/optimize-image.ts";
import { mapMediaError } from "../src/lib/media/upload-errors.ts";
import { hydrateArticleBlocks } from "../src/lib/content/article-blocks.ts";

assert.deepEqual(fitMaxSide(4000, 3000, 1920), { width: 1920, height: 1440 });
assert.deepEqual(fitMaxSide(800, 600, 1920), { width: 800, height: 600 });
assert.deepEqual(fitMaxSide(1920, 1080, 1920), { width: 1920, height: 1080 });

const jpeg = { name: "a.jpg", type: "image/jpeg", size: 12 } as File;
const heic = { name: "b.HEIC", type: "", size: 12 } as File;
assert.equal(isLikelyImageFile(jpeg), true);
assert.equal(isLikelyImageFile(heic), true);
assert.equal(isHeicFile(heic), true);

assert.equal(
  mapMediaError(new Error("new row violates row-level security policy")),
  "圖片上傳失敗：Storage 權限不足",
);
assert.equal(
  mapMediaError(new Error("mime type image/heic is not supported")),
  "圖片上傳失敗：檔案格式不支援",
);
assert.equal(mapMediaError(new Error("無法讀取這張圖片")), "圖片處理失敗，請重新選擇圖片");

const hydrated = hydrateArticleBlocks(
  [
    {
      id: "11111111-1111-4111-8111-111111111111",
      type: "image",
      data: {
        url: "blob:http://localhost/fake",
        caption: "x",
        assetId: "21111111-1111-4111-8111-111111111111",
        storagePath: "user/article/file.webp",
      },
    },
  ],
  "",
  [
    {
      id: "21111111-1111-4111-8111-111111111111",
      content_item_id: "article-1",
      asset_type: "image",
      status: "ready",
      bucket: "content-media",
      storage_path: "user/article/file.webp",
      file_name: "file.webp",
      mime_type: "image/webp",
      size_bytes: 12,
      width: null,
      height: null,
      duration_seconds: null,
      alt_text: "",
      sort_order: 0,
      signed_url: "https://cdn.example/signed.webp",
    },
  ],
);
assert.equal(hydrated[0]?.type, "image");
if (hydrated[0]?.type === "image") {
  assert.equal(hydrated[0].data.url, "https://cdn.example/signed.webp");
  assert.ok(!hydrated[0].data.url.startsWith("blob:"));
}

console.log("image upload verification passed");
