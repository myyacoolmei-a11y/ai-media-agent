import type { Metadata } from "next";

import { ResultsView } from "@/components/results-view";

export const metadata: Metadata = {
  title: "內容結果",
};

export default function ResultsPage() {
  return <ResultsView />;
}
