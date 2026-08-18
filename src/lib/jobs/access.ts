import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isPreviewDemo, PREVIEW_DEMO_COOKIE, PREVIEW_DEMO_USER } from "@/lib/preview";

export async function getAuthenticatedUser() {
  if (isPreviewDemo()) {
    const jar = await cookies();
    if (jar.get(PREVIEW_DEMO_COOKIE)?.value === "1") {
      return PREVIEW_DEMO_USER as User;
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return error ? null : user;
}

export async function verifyProjectAccess(projectId: string) {
  if (isPreviewDemo()) return null;
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const supabase = createAdminClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !project) return null;
  const { getBrandContext } = await import("@/lib/brands/access");
  const context = await getBrandContext(user);
  if (!context?.brands.some((brand) => brand.id === project.brand_id)) return null;

  return { supabase, project, user, context };
}
