import { notFound } from "next/navigation";

import { BrandManagement } from "@/components/admin/brand-management";
import { requireSuperAdmin } from "@/lib/brands/access";
import { listBrandMembers } from "@/lib/brands/members";
import { isPreviewDemo } from "@/lib/preview";

export default async function AdminBrandsPage() {
  const context = await requireSuperAdmin();
  if (!context) notFound();
  const members = isPreviewDemo() ? [] : await listBrandMembers();

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-[-0.045em]">品牌管理</h1>
      <p className="mt-3 text-sm text-zinc-500">
        新增品牌，並授權帳號可存取的品牌與角色。
      </p>
      <div className="mt-8">
        <BrandManagement brands={context.brands} members={members} />
      </div>
    </div>
  );
}
