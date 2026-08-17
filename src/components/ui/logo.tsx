import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  wordmark = "AI Media Agent",
}: {
  className?: string;
  wordmark?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-8 place-items-center rounded-xl border border-[#e2b8bd]/25 bg-[#e2b8bd]/10">
        <Sparkles className="size-4 text-[#e2b8bd]" />
      </span>
      <span className="text-sm font-semibold tracking-[-0.02em] text-white">
        {wordmark}
      </span>
    </div>
  );
}
