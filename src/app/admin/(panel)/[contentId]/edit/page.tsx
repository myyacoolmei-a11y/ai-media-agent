import { notFound } from "next/navigation";

import { ArticleEditor } from "@/components/admin/article-editor";
import {
  loadContentWithAssets,
  verifyContentAccess,
} from "@/lib/content/access";
import type { BrandStyleProfile } from "@/types/style";

type AdminEditPageProps = {
  params: Promise<{ contentId: string }>;
};

export default async function AdminEditPage({ params }: AdminEditPageProps) {
  const { contentId } = await params;
  const access = await verifyContentAccess(contentId);
  if (!access || access.content.content_type !== "article") notFound();
  const [content, { data: styles }] = await Promise.all([
    loadContentWithAssets(access.content),
    access.supabase
      .from("brand_style_profiles")
      .select("*")
      .eq("user_id", access.user.id)
      .order("updated_at", { ascending: false }),
  ]);

  return (
    <ArticleEditor
      initialContent={content}
      styles={(styles ?? []) as BrandStyleProfile[]}
    />
  );
}
