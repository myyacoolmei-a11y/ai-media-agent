import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/jobs/access";
import { generateSocialCopy } from "@/lib/social/copy";
import { socialCopyRequestSchema } from "@/types/social";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }
  const payload = socialCopyRequestSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "報導資料不完整。" }, { status: 400 });
  }
  const copy = await generateSocialCopy({
    title: payload.data.title,
    summary: payload.data.summary,
    content: payload.data.content,
    slug: payload.data.slug,
    hashtags: payload.data.hashtags,
    seoKeywords: payload.data.seoKeywords,
    hasVideo: payload.data.hasVideo,
    articleUrl: payload.data.articleUrl,
  });
  return NextResponse.json({ copy });
}
