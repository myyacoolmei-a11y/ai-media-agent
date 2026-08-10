import { NextResponse } from "next/server";

import { serializePublicContent } from "@/lib/content/public-query";
import { createAdminClient } from "@/lib/supabase/admin";
import { contentTypeSchema, type ContentItem } from "@/types/content";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit")) || 20, 1),
    50,
  );
  const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);
  const category = url.searchParams.get("category")?.trim();
  const type = contentTypeSchema.safeParse(url.searchParams.get("contentType"));
  let query = createAdminClient()
    .from("content_items")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category", category);
  if (type.success) query = query.eq("content_type", type.data);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: "無法讀取已發布內容。" }, { status: 500 });
  }
  const items = await Promise.all(
    ((data ?? []) as ContentItem[]).map(serializePublicContent),
  );
  return NextResponse.json(
    { items, total: count ?? 0, limit, offset },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
