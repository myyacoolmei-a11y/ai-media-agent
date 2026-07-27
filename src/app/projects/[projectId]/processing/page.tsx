import type { Metadata } from "next";

import { ProcessingView } from "@/components/processing-view";

export const metadata: Metadata = {
  title: "AI 分析中",
};

export default function ProcessingPage() {
  return <ProcessingView />;
}
