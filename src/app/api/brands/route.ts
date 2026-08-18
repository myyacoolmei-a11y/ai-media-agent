import { NextResponse } from "next/server";

import { getBrandContext, requireSuperAdmin } from "@/lib/brands/access";
import { getAuthenticatedUser } from "@/lib/jobs/access";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import { brandInputSchema } from "@/types/brand";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }
  const context = await getBrandContext(user);
  if (!context) {
    return NextResponse.json({ error: "沒有可存取的品牌。" }, { status: 403 });
  }
  return NextResponse.json({
    brand: context.brand,
    role: context.role,
    brands: context.brands,
    isSuperAdmin: context.isSuperAdmin,
    showSwitcher: context.showSwitcher,
    showManagement: context.showManagement,
  });
}

export async function POST(request: Request) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const context = await requireSuperAdmin();
  if (!context) {
    return NextResponse.json({ error: "沒有品牌管理權限。" }, { status: 403 });
  }
  const payload = brandInputSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "品牌資料不完整。" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .insert({
      name: payload.data.name,
      slug: payload.data.slug,
      logo_url: payload.data.logoUrl ?? null,
      is_active: payload.data.isActive ?? true,
    })
    .select("*")
    .single();
  if (error) {
    return NextResponse.json(
      {
        error:
          error.code === "23505" ? "這個品牌網址已被使用。" : error.message,
      },
      { status: error.code === "23505" ? 409 : 500 },
    );
  }
  return NextResponse.json({ brand: data }, { status: 201 });
}
