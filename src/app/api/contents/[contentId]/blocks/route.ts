import { NextResponse } from "next/server";

import { hydrateBlockMedia, loadArticleBlocks } from "@/lib/content/blocks";
import { verifyContentAccess } from "@/lib/content/access";
import {
  MAX_ARTICLE_IMAGES,
  MAX_ARTICLE_VIDEOS,
  countArticleImages,
  countArticleVideos,
} from "@/lib/content/limits";
import { isMissingRelation } from "@/lib/db/missing";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";
import { articleBlocksSaveSchema } from "@/types/blocks";

type RouteContext = {
  params: Promise<{ contentId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { contentId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  const blocks = await hydrateBlockMedia(await loadArticleBlocks(contentId));
  return NextResponse.json({ blocks });
}

export async function PUT(request: Request, context: RouteContext) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const { contentId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  if (!access.supabase) return previewWriteBlocked();
  const payload = articleBlocksSaveSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "區塊資料不正確。" }, { status: 400 });
  }

  const countable = payload.data.blocks.map((block) => ({
    type: block.type,
    metadata: block.metadata,
  }));
  if (countArticleImages(countable) > MAX_ARTICLE_IMAGES) {
    return NextResponse.json(
      { error: `內文圖片（含圖集）最多 ${MAX_ARTICLE_IMAGES} 張。` },
      { status: 400 },
    );
  }
  if (countArticleVideos(countable) > MAX_ARTICLE_VIDEOS) {
    return NextResponse.json(
      { error: `每篇最多 ${MAX_ARTICLE_VIDEOS} 支影片。` },
      { status: 400 },
    );
  }

  const rows = payload.data.blocks.map((block, index) => ({
    id: block.id ?? crypto.randomUUID(),
    article_id: contentId,
    type: block.type,
    sort_order: index,
    content: block.content ?? "",
    media_url: block.mediaUrl ?? null,
    thumbnail_url: block.thumbnailUrl ?? null,
    caption: block.caption ?? "",
    source: block.source ?? "",
    alt_text: block.altText ?? "",
    metadata: block.metadata ?? {},
  }));

  const { error: deleteError } = await access.supabase
    .from("article_blocks")
    .delete()
    .eq("article_id", contentId);
  if (deleteError) {
    if (isMissingRelation(deleteError)) {
      return NextResponse.json(
        { error: "請先在 Supabase SQL Editor 執行 article_blocks 的 migration。" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (rows.length) {
    const { error: insertError } = await access.supabase
      .from("article_blocks")
      .insert(rows);
    if (insertError) {
      const dividerMissing = /divider/i.test(insertError.message);
      if (dividerMissing) {
        const fallback = rows.map((row) =>
          row.type === "divider"
            ? { ...row, type: "text" as const, metadata: { ...row.metadata, kind: "divider" } }
            : row,
        );
        const { error: retryError } = await access.supabase
          .from("article_blocks")
          .insert(fallback);
        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }
  }

  const blocks = await hydrateBlockMedia(await loadArticleBlocks(contentId));
  return NextResponse.json({ blocks });
}
