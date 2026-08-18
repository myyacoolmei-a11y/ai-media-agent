import { z } from "zod";

export const brandAccessRoleSchema = z.enum([
  "super_admin",
  "owner",
  "admin",
  "editor",
]);

export type BrandAccessRole = z.infer<typeof brandAccessRoleSchema>;

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UserBrandAccess = {
  id: string;
  user_id: string;
  brand_id: string;
  role: BrandAccessRole;
  is_default: boolean;
  created_at: string;
};

export type BrandContext = {
  brand: Brand;
  role: BrandAccessRole;
  brands: Brand[];
  isSuperAdmin: boolean;
  showSwitcher: boolean;
  showManagement: boolean;
};

export const brandInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  logoUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const brandMemberInputSchema = z.object({
  email: z.string().trim().email(),
  brandId: z.string().uuid(),
  role: brandAccessRoleSchema,
  isDefault: z.boolean().optional(),
});
