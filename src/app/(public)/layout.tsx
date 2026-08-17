import { Suspense } from "react";

import { PublicFooter, PublicHeader } from "@/components/public/site-chrome";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a090a] text-white">
      <Suspense fallback={<div className="h-[8.25rem] border-b border-white/[0.08]" />}>
        <PublicHeader />
      </Suspense>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8 sm:py-14">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
