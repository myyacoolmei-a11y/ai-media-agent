import { NextResponse } from "next/server";

import { getPublishedStory } from "@/lib/content/published";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const item = await getPublishedStory(slug);
  if (!item) {
    return NextResponse.json({ error: "找不到已發布內容。" }, { status: 404 });
  }
  return NextResponse.json(
    { item },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
