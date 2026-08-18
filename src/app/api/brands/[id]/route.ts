import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/brands/access";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import { brandInputSchema } from "@/types/brand";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const access = await requireSuperAdmin();
  if (!access) {
    return NextResponse.json({ error: "沒有品牌管理權限。" }, { status: 403 });
  }
  const { id } = await context.params;
  const payload = brandInputSchema.partial().safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "品牌資料不完整。" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .update({
      ...(payload.data.name ? { name: payload.data.name } : {}),
      ...(payload.data.slug ? { slug: payload.data.slug } : {}),
      ...(payload.data.logoUrl !== undefined
        ? { logo_url: payload.data.logoUrl }
        : {}),
      ...(payload.data.isActive !== undefined
        ? { is_active: payload.data.isActive }
        : {}),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ brand: data });
}
