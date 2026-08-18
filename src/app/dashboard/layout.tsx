import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard-shell";
import { getBrandContext } from "@/lib/brands/access";
import { getAuthenticatedUser } from "@/lib/jobs/access";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?next=/dashboard");
  const brandContext = await getBrandContext(user);

  return (
    <DashboardShell email={user.email ?? "已登入"} brandContext={brandContext}>
      {children}
    </DashboardShell>
  );
}
