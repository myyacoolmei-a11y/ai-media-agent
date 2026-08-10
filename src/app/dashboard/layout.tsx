import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard-shell";
import { getAuthenticatedUser } from "@/lib/jobs/access";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?next=/dashboard");

  return (
    <DashboardShell email={user.email ?? "已登入"}>{children}</DashboardShell>
  );
}
