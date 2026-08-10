import type { Metadata } from "next";

import { NewContentForm } from "@/components/new-content-form";

export const metadata: Metadata = { title: "新增內容" };

export default function NewContentPage() {
  return <NewContentForm />;
}
