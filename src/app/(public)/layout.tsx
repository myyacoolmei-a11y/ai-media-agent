import { PublicFooter, PublicHeader } from "@/components/public/site-chrome";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a090a] text-white">
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
