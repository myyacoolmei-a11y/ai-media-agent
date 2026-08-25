import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/jobs/access";
import { listSocialPublications, type SocialListFilter } from "@/lib/social/store";
import {
  socialPlatformSchema,
  socialPublicationStatusSchema,
} from "@/types/social";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }
  const url = new URL(request.url);
  const platformValue = url.searchParams.get("platform");
  const statusValue = url.searchParams.get("status");
  const platform = platformValue
    ? socialPlatformSchema.safeParse(platformValue)
    : null;
  if (platform && !platform.success) {
    return NextResponse.json({ error: "平台不正確。" }, { status: 400 });
  }

  let status: SocialListFilter["status"];
  if (statusValue === "pending" || statusValue === "success") {
    status = statusValue;
  } else if (statusValue) {
    const parsed = socialPublicationStatusSchema.safeParse(statusValue);
    if (!parsed.success) {
      return NextResponse.json({ error: "狀態不正確。" }, { status: 400 });
    }
    status = parsed.data;
  }

  const publications = await listSocialPublications({
    userId: user.id,
    contentId: url.searchParams.get("contentId") ?? undefined,
    platform: platform?.success ? platform.data : undefined,
    status,
  });
  return NextResponse.json({ publications });
}
