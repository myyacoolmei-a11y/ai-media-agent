import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-8 place-items-center rounded-xl border border-lime-300/30 bg-lime-300/10">
        <Sparkles className="size-4 text-lime-300" />
      </span>
      <span className="text-sm font-semibold tracking-[-0.02em] text-white">
        AI Media Agent
      </span>
    </div>
  );
}
