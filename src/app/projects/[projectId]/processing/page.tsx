import type { Metadata } from "next";

import { ProcessingView } from "@/components/processing-view";

export const metadata: Metadata = {
  title: "內容製作中",
};

type ProcessingPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProcessingPage({ params }: ProcessingPageProps) {
  const { projectId } = await params;
  return <ProcessingView projectId={projectId} />;
}
