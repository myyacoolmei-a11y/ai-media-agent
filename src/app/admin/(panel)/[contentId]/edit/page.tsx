import { notFound } from "next/navigation";

import { ArticleEditor } from "@/components/admin/article-editor";
import {
  loadContentWithAssets,
  verifyContentAccess,
} from "@/lib/content/access";

type AdminEditPageProps = {
  params: Promise<{ contentId: string }>;
};

export default async function AdminEditPage({ params }: AdminEditPageProps) {
  const { contentId } = await params;
  const access = await verifyContentAccess(contentId);
  if (!access || access.content.content_type !== "article") notFound();
  const content = await loadContentWithAssets(access.content);

  return <ArticleEditor initialContent={content} />;
}
