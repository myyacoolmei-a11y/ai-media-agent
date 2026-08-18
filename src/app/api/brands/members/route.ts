import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSuperAdmin } from "@/lib/brands/access";
import { listBrandMembers } from "@/lib/brands/members";
import {
  FENGBAO_BRAND_ID,
  isLimitedFengbaoAccount,
} from "@/lib/brands/constants";
import { isPreviewDemo, previewWriteBlocked } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import { brandMemberInputSchema } from "@/types/brand";

const deleteSchema = z.object({
  userId: z.string().uuid(),
  brandId: z.string().uuid(),
});

export async function GET() {
  const context = await requireSuperAdmin();
  if (!context) {
    return NextResponse.json({ error: "沒有品牌管理權限。" }, { status: 403 });
  }
  try {
    const members = await listBrandMembers();
    return NextResponse.json({ members });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "無法讀取帳號權限。" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const context = await requireSuperAdmin();
  if (!context) {
    return NextResponse.json({ error: "沒有品牌管理權限。" }, { status: 403 });
  }
  const payload = brandMemberInputSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "帳號權限資料不完整。" }, { status: 400 });
  }
  if (!context.brands.some((brand) => brand.id === payload.data.brandId)) {
    return NextResponse.json({ error: "找不到品牌。" }, { status: 404 });
  }

  const supabase = createAdminClient();
  const { data: users, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }
  const email = payload.data.email.trim().toLowerCase();
  const user = (users.users ?? []).find(
    (item) => item.email?.toLowerCase() === email,
  );
  if (!user) {
    return NextResponse.json({ error: "找不到這個登入帳號。" }, { status: 404 });
  }

  if (
    isLimitedFengbaoAccount(user.email) &&
    payload.data.brandId !== FENGBAO_BRAND_ID
  ) {
    return NextResponse.json(
      { error: "這個帳號目前只授權風曝。" },
      { status: 403 },
    );
  }

  const role = isLimitedFengbaoAccount(user.email)
    ? "editor"
    : payload.data.role;
  const isDefault = payload.data.isDefault ?? false;

  if (isDefault) {
    await supabase
      .from("user_brand_access")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  const { data, error } = await supabase
    .from("user_brand_access")
    .upsert(
      {
        user_id: user.id,
        brand_id: payload.data.brandId,
        role,
        is_default: isDefault,
      },
      { onConflict: "user_id,brand_id" },
    )
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ member: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (isPreviewDemo()) return previewWriteBlocked();
  const context = await requireSuperAdmin();
  if (!context) {
    return NextResponse.json({ error: "沒有品牌管理權限。" }, { status: 403 });
  }
  const payload = deleteSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "帳號權限資料不完整。" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("user_brand_access")
    .delete()
    .eq("user_id", payload.data.userId)
    .eq("brand_id", payload.data.brandId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ deleted: true });
}
