import type { Metadata } from "next";

import { StyleProfileForm } from "@/components/style-profile-form";

export const metadata: Metadata = { title: "建立我的風格" };

export default function NewStylePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-[-0.045em] text-white">
          建立我的風格
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          這不是固定模板，而是你的專屬內容原則。之後可以持續修改與養成。
        </p>
      </div>
      <StyleProfileForm />
    </div>
  );
}
