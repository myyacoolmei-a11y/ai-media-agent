import { AdminHeader } from "@/components/admin/admin-header";

export default function StylesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#090809]">
      <AdminHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
