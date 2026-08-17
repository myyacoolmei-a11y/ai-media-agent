import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin/admin-header";
import { getAuthenticatedUser } from "@/lib/jobs/access";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?next=/admin");

  return (
    <div className="min-h-screen bg-[#090809]">
      <AdminHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">{children}</main>
    </div>
  );
}
