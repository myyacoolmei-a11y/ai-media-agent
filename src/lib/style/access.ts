import { getBrandContext } from "@/lib/brands/access";
import { getAuthenticatedUser } from "@/lib/jobs/access";
import { isPreviewDemo } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BrandStyleProfile } from "@/types/style";

export async function verifyStyleAccess(styleId: string) {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  if (isPreviewDemo()) return null;

  const context = await getBrandContext(user);
  if (!context) return null;

  const supabase = createAdminClient();
  const { data: style, error } = await supabase
    .from("brand_style_profiles")
    .select("*")
    .eq("id", styleId)
    .maybeSingle();
  if (error || !style) return null;
  if (!context.brands.some((brand) => brand.id === style.brand_id)) return null;
  return {
    user,
    supabase,
    style: style as BrandStyleProfile,
    context,
  };
}
