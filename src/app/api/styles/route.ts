import { NextResponse } from "next/server";

import { requireBrandContext } from "@/lib/brands/access";
import { getAuthenticatedUser } from "@/lib/jobs/access";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import { brandStyleInputSchema } from "@/types/style";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }
  const context = await requireBrandContext();
  if (!context) {
    return NextResponse.json({ error: "沒有可存取的品牌。" }, { status: 403 });
  }
  if (isPreviewDemo()) {
    return NextResponse.json({ styles: [] });
  }

  const { data, error } = await createAdminClient()
    .from("brand_style_profiles")
    .select("*")
    .eq("brand_id", context.brand.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ styles: data ?? [] });
}

export async function POST(request: Request) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }

  const context = await requireBrandContext();
  if (!context) {
    return NextResponse.json({ error: "沒有可存取的品牌。" }, { status: 403 });
  }

  const payload = brandStyleInputSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: "風格資料不完整。", issues: payload.error.issues },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brand_style_profiles")
    .insert({ ...payload.data, user_id: user.id, brand_id: context.brand.id })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: error.code === "23505" ? "已有相同名稱的風格。" : error.message,
      },
      { status: 500 },
    );
  }

  await supabase.from("personal_editors").upsert(
    { user_id: user.id, active_style_profile_id: data.id },
    { onConflict: "user_id" },
  );
  return NextResponse.json({ style: data }, { status: 201 });
}
