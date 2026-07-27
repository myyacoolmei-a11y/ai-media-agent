import { SiteHeader } from "@/components/site-header";

export default function ProjectsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#070707]">
      <SiteHeader compact />
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        {children}
      </main>
    </div>
  );
}
