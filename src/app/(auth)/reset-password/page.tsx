import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "設定新密碼" };

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <AuthForm mode="reset" />
    </Suspense>
  );
}
