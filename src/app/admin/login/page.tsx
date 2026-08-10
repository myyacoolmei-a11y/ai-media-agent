import { Suspense } from "react";

import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#090809]">
      <SiteHeader compact />
      <main className="px-5 py-16 sm:py-24">
        <Suspense>
          <AuthForm mode="login" defaultNext="/admin" />
        </Suspense>
      </main>
    </div>
  );
}
