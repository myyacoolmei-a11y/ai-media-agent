import { Suspense } from "react";

import { PublicFooter, PublicHeader } from "@/components/public/site-chrome";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a090a] text-white">
      <Suspense fallback={<div className="h-[6.5rem] border-b border-white/[0.07]" />}>
        <PublicHeader />
      </Suspense>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8 sm:py-12">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
