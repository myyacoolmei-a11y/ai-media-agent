import { NextResponse } from "next/server";

import { listPublishedStories } from "@/lib/content/published";
import { contentTypeSchema } from "@/types/content";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit")) || 20, 1),
    50,
  );
  const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);
  const category = url.searchParams.get("category")?.trim();
  const type = contentTypeSchema.safeParse(url.searchParams.get("contentType"));
  const items = await listPublishedStories({
    limit: offset + limit,
    category: category || undefined,
  });
  const filtered = type.success
    ? items.filter((item) => item.contentType === type.data)
    : items;
  const page = filtered.slice(offset, offset + limit);
  return NextResponse.json(
    { items: page, total: filtered.length, limit, offset },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
