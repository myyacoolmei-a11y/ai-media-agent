import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyStyleAccess } from "@/lib/style/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { brandStyleInputSchema } from "@/types/style";

type RouteContext = {
  params: Promise<{ styleId: string; suggestionId: string }>;
};

const decisionSchema = z.object({
  decision: z.enum(["accept", "dismiss"]),
});

export async function PATCH(request: Request, context: RouteContext) {
  const { styleId, suggestionId } = await context.params;
  const access = await verifyStyleAccess(styleId);
  if (!access) {
    return NextResponse.json({ error: "找不到此風格。" }, { status: 404 });
  }
  const payload = decisionSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "選擇不正確。" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: suggestion } = await supabase
    .from("preference_suggestions")
    .select("*")
    .eq("id", suggestionId)
    .eq("style_profile_id", styleId)
    .eq("user_id", access.user.id)
    .eq("status", "pending")
    .single();
  if (!suggestion) {
    return NextResponse.json({ error: "找不到待確認建議。" }, { status: 404 });
  }

  if (payload.data.decision === "accept") {
    const changes = brandStyleInputSchema
      .partial()
      .safeParse(suggestion.suggested_changes);
    if (!changes.success) {
      return NextResponse.json(
        { error: "偏好建議內容無法套用。" },
        { status: 400 },
      );
    }
    const { error } = await supabase
      .from("brand_style_profiles")
      .update(changes.data)
      .eq("id", styleId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  await supabase
    .from("preference_suggestions")
    .update({
      status: payload.data.decision === "accept" ? "accepted" : "dismissed",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", suggestionId)
    .eq("user_id", access.user.id);

  return NextResponse.json({ updated: true });
}
