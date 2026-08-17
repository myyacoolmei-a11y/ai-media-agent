import { notFound } from "next/navigation";

import { ContentForm } from "@/components/admin/content-form";
import {
  loadContentWithAssets,
  verifyContentAccess,
} from "@/lib/content/access";

type AdminEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditPage({ params }: AdminEditPageProps) {
  const { id } = await params;
  const access = await verifyContentAccess(id);
  if (!access) notFound();
  const content = await loadContentWithAssets(access.content);

  return <ContentForm initialContent={content} />;
}
