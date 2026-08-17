import { PublicFooter, PublicHeader } from "@/components/public/site-chrome";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-[#090809]">
      <PublicHeader />
      <main className="flex-1 px-5 py-16 sm:px-8 sm:py-24">{children}</main>
      <PublicFooter />
    </div>
  );
}
