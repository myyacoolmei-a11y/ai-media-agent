import { createAdminClient } from "@/lib/supabase/admin";
import type { BrandAccessRole } from "@/types/brand";

export type BrandMemberRow = {
  id: string;
  user_id: string;
  brand_id: string;
  role: BrandAccessRole;
  is_default: boolean;
  created_at: string;
  email: string | null;
  brand_name: string | null;
  brand_slug: string | null;
};

export async function listBrandMembers(): Promise<BrandMemberRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("user_brand_access")
    .select("id,user_id,brand_id,role,is_default,created_at,brands(name,slug)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);

  const { data: users, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) throw new Error(listError.message);
  const emails = new Map(
    (users.users ?? []).map((user) => [user.id, user.email ?? null]),
  );

  return (data ?? []).map((row) => {
    const brand = Array.isArray(row.brands) ? row.brands[0] : row.brands;
    return {
      id: row.id,
      user_id: row.user_id,
      brand_id: row.brand_id,
      role: row.role as BrandAccessRole,
      is_default: row.is_default,
      created_at: row.created_at,
      email: emails.get(row.user_id) ?? null,
      brand_name: brand?.name ?? null,
      brand_slug: brand?.slug ?? null,
    };
  });
}
