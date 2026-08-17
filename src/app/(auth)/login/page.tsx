import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "管理員登入" };

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" defaultNext="/admin" showAlternateAuth={false} />
    </Suspense>
  );
}
