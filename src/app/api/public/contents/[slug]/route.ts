import { NextResponse } from "next/server";

import { serializePublicContent } from "@/lib/content/public-query";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentItem } from "@/types/content";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const { data, error } = await createAdminClient()
    .from("content_items")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "找不到已發布內容。" }, { status: 404 });
  }
  return NextResponse.json(
    { item: await serializePublicContent(data as ContentItem) },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
