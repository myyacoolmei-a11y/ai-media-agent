import { SiteHeader } from "@/components/site-header";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#090809]">
      <SiteHeader compact />
      <main className="px-5 py-16 sm:px-8 sm:py-24">{children}</main>
    </div>
  );
}
