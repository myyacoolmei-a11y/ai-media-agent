import type { Metadata } from "next";

import { ProcessingView } from "@/components/processing-view";

export const metadata: Metadata = {
  title: "內容製作中",
};

export default function ProcessingPage() {
  return <ProcessingView />;
}
