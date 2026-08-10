import { notFound } from "next/navigation";

import { ContentEditor } from "@/components/content-editor";
import {
  loadContentWithAssets,
  verifyContentAccess,
} from "@/lib/content/access";
import type { BrandStyleProfile } from "@/types/style";

type EditContentPageProps = {
  params: Promise<{ contentId: string }>;
};

export default async function EditContentPage({
  params,
}: EditContentPageProps) {
  const { contentId } = await params;
  const access = await verifyContentAccess(contentId);
  if (!access) notFound();

  const [{ data: styles }, content] = await Promise.all([
    access.supabase
      .from("brand_style_profiles")
      .select("*")
      .eq("user_id", access.user.id)
      .order("updated_at", { ascending: false }),
    loadContentWithAssets(access.content),
  ]);

  return (
    <ContentEditor
      initialContent={content}
      styles={(styles ?? []) as BrandStyleProfile[]}
    />
  );
}
