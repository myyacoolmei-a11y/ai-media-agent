import { NextResponse } from "next/server";

import { verifyContentAccess } from "@/lib/content/access";
import { isPreviewDemo } from "@/lib/preview";
import {
  PREVIEW_SOCIAL_DB_BLOCKED,
  listSocialPublications,
  upsertSocialDraft,
} from "@/lib/social/store";
import { SOCIAL_PLATFORMS } from "@/lib/social/platforms";
import { socialDraftsSchema } from "@/types/social";

type RouteContext = {
  params: Promise<{ contentId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { contentId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  const publications = await listSocialPublications({
    userId: access.user.id,
    brandId: access.content.brand_id ?? access.context.brand.id,
    contentId,
  });
  return NextResponse.json({ publications });
}

export async function PUT(request: Request, context: RouteContext) {
  const { contentId } = await context.params;
  const access = await verifyContentAccess(contentId);
  if (!access) {
    return NextResponse.json({ error: "找不到內容或沒有權限。" }, { status: 404 });
  }
  if (isPreviewDemo()) {
    return NextResponse.json({ error: PREVIEW_SOCIAL_DB_BLOCKED }, { status: 403 });
  }
  const payload = socialDraftsSchema.safeParse({
    ...(await request.json()),
    contentId,
  });
  if (!payload.success) {
    return NextResponse.json({ error: "社群文案格式不正確。" }, { status: 400 });
  }
  const mediaUrl = payload.data.mediaUrl ?? access.content.cover_image ?? null;
  const publications = [];
  for (const platform of SOCIAL_PLATFORMS) {
    const text = payload.data.drafts[platform];
    if (typeof text !== "string") continue;
    publications.push(
      await upsertSocialDraft({
        userId: access.user.id,
        brandId: access.content.brand_id ?? access.context.brand.id,
        contentId,
        platform,
        socialText: text,
        mediaUrl,
      }),
    );
  }
  return NextResponse.json({ publications });
}
