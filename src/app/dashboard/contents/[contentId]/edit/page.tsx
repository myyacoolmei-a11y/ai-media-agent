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

  const content = await loadContentWithAssets(access.content);
  let styles: BrandStyleProfile[] = [];
  if (access.supabase) {
    const { data } = await access.supabase
      .from("brand_style_profiles")
      .select("*")
      .eq("user_id", access.user.id)
      .order("updated_at", { ascending: false });
    styles = (data ?? []) as BrandStyleProfile[];
  }

  return (
    <ContentEditor
      initialContent={content}
      styles={styles}
    />
  );
}
