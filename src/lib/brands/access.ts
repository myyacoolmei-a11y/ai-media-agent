import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

import {
  ACTIVE_BRAND_COOKIE,
  FENGBAO_BRAND_ID,
  FENGBAO_BRAND_NAME,
  FENGBAO_BRAND_SLUG,
  isLimitedFengbaoAccount,
  superAdminEmailsFromEnv,
} from "@/lib/brands/constants";
import { getAuthenticatedUser } from "@/lib/jobs/access";
import { isPreviewDemo } from "@/lib/preview";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Brand, BrandAccessRole, BrandContext } from "@/types/brand";

const previewBrand: Brand = {
  id: FENGBAO_BRAND_ID,
  name: FENGBAO_BRAND_NAME,
  slug: FENGBAO_BRAND_SLUG,
  logo_url: null,
  is_active: true,
  created_at: "2026-08-18T00:00:00.000Z",
  updated_at: "2026-08-18T00:00:00.000Z",
};

function previewContext(): BrandContext {
  return {
    brand: previewBrand,
    role: "editor",
    brands: [previewBrand],
    isSuperAdmin: false,
    showSwitcher: false,
    showManagement: false,
  };
}

export function isEnvSuperAdmin(email: string | null | undefined) {
  if (!email || isLimitedFengbaoAccount(email)) return false;
  return superAdminEmailsFromEnv().includes(email.trim().toLowerCase());
}

export async function getBrandContext(
  user?: User | null,
): Promise<BrandContext | null> {
  const current = user === undefined ? await getAuthenticatedUser() : user;
  if (!current) return null;
  if (isPreviewDemo()) return previewContext();

  const supabase = createAdminClient();
  const envSuperAdmin = isEnvSuperAdmin(current.email);
  const { data: accessRows, error: accessError } = await supabase
    .from("user_brand_access")
    .select("role,is_default,brand_id,brands(*)")
    .eq("user_id", current.id);
  if (accessError) {
    if (
      accessError.code === "42P01" ||
      /does not exist|schema cache/i.test(accessError.message)
    ) {
      throw new Error(
        "請先在 Supabase SQL Editor 執行 supabase/migrations/202608180002_brands_access.sql",
      );
    }
    throw new Error(accessError.message);
  }

  const linked = (accessRows ?? [])
    .map((row) => {
      const brand = Array.isArray(row.brands) ? row.brands[0] : row.brands;
      if (!brand || brand.is_active === false) return null;
      return {
        brand: brand as Brand,
        role: row.role as BrandAccessRole,
        isDefault: Boolean(row.is_default),
      };
    })
    .filter(Boolean) as Array<{
    brand: Brand;
    role: BrandAccessRole;
    isDefault: boolean;
  }>;

  const tableSuperAdmin = linked.some((row) => row.role === "super_admin");
  const isSuperAdmin = envSuperAdmin || tableSuperAdmin;

  let brands: Brand[] = linked.map((row) => row.brand);
  if (isSuperAdmin) {
    const { data: allBrands, error } = await supabase
      .from("brands")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    brands = (allBrands ?? []) as Brand[];
  }

  if (isLimitedFengbaoAccount(current.email)) {
    brands = brands.filter((brand) => brand.slug === FENGBAO_BRAND_SLUG);
  }

  if (!brands.length) return null;

  const jar = await cookies();
  const requested = jar.get(ACTIVE_BRAND_COOKIE)?.value;
  const defaultLinked = linked.find((row) => row.isDefault)?.brand.id;
  const selected =
    brands.find((brand) => brand.id === requested) ??
    brands.find((brand) => brand.id === defaultLinked) ??
    brands.find((brand) => brand.slug === FENGBAO_BRAND_SLUG) ??
    brands[0];

  const role =
    linked.find((row) => row.brand.id === selected.id)?.role ??
    (isSuperAdmin ? "super_admin" : "editor");

  return {
    brand: selected,
    role: isLimitedFengbaoAccount(current.email) ? "editor" : role,
    brands,
    isSuperAdmin: isLimitedFengbaoAccount(current.email) ? false : isSuperAdmin,
    showSwitcher: brands.length >= 2,
    showManagement:
      !isLimitedFengbaoAccount(current.email) && isSuperAdmin,
  };
}

export async function requireBrandContext() {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  const context = await getBrandContext(user);
  if (!context) return null;
  return { user, ...context };
}

export async function requireBrandAccess(brandId: string) {
  const context = await requireBrandContext();
  if (!context) return null;
  if (!context.brands.some((brand) => brand.id === brandId)) return null;
  return context;
}

export async function requireSuperAdmin() {
  const context = await requireBrandContext();
  if (!context?.isSuperAdmin) return null;
  return context;
}

export function canAccessBrand(context: BrandContext, brandId: string) {
  return context.brands.some((brand) => brand.id === brandId);
}
