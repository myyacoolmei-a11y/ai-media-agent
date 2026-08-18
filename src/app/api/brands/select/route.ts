import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBrandAccess } from "@/lib/brands/access";
import { ACTIVE_BRAND_COOKIE } from "@/lib/brands/constants";

const bodySchema = z.object({
  brandId: z.string().uuid(),
});

export async function POST(request: Request) {
  const payload = bodySchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "品牌不正確。" }, { status: 400 });
  }
  const context = await requireBrandAccess(payload.data.brandId);
  if (!context) {
    return NextResponse.json({ error: "沒有這個品牌的權限。" }, { status: 403 });
  }
  if (!context.showSwitcher) {
    return NextResponse.json({ brand: context.brand });
  }
  const jar = await cookies();
  jar.set(ACTIVE_BRAND_COOKIE, payload.data.brandId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.json({ brand: context.brand });
}
