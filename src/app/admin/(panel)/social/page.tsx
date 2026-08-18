import { Share2 } from "lucide-react";

import { MetaSetupGuide } from "@/components/admin/meta-setup-guide";
import { SocialStatusBoard } from "@/components/admin/social-status-board";

export default function AdminSocialPage() {
  return (
    <div>
      <div className="flex items-start gap-3">
        <Share2 className="mt-1 size-5 text-[#d3b176]" />
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#d3b176]">
            Social
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
            社群發布
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-500">
            網站發布與 Facebook、Instagram、Threads、TikTok 狀態分開計算。其中一個失敗不會回滾 NEWS風曝。
          </p>
        </div>
      </div>
      <div className="mt-8 space-y-8">
        <MetaSetupGuide />
        <SocialStatusBoard />
      </div>
    </div>
  );
}
