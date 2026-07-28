import type { Metadata } from "next";

import { ResultsView } from "@/components/results-view";

export const metadata: Metadata = {
  title: "內容結果",
};

type ResultsPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { projectId } = await params;
  return <ResultsView projectId={projectId} />;
}
