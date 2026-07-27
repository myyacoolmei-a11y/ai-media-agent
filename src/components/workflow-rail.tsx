import { Check, CircleDashed, LoaderCircle } from "lucide-react";

import { AI_WORKFLOW } from "@/lib/ai/workflow";
import { cn } from "@/lib/utils";

type WorkflowRailProps = {
  activeIndex?: number;
  completed?: boolean;
  orientation?: "horizontal" | "vertical";
};

export function WorkflowRail({
  activeIndex = 0,
  completed = false,
  orientation = "horizontal",
}: WorkflowRailProps) {
  if (orientation === "vertical") {
    return (
      <ol className="space-y-0">
        {AI_WORKFLOW.map((stage, index) => {
          const isDone = completed || index < activeIndex;
          const isActive = !completed && index === activeIndex;

          return (
            <li key={stage.id} className="relative flex gap-4 pb-6 last:pb-0">
              {index < AI_WORKFLOW.length - 1 && (
                <span
                  className={cn(
                    "absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px",
                    isDone ? "bg-lime-300/40" : "bg-white/10",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border",
                  isDone && "border-lime-300/40 bg-lime-300/10 text-lime-300",
                  isActive && "border-lime-300 bg-lime-300 text-black",
                  !isDone && !isActive && "border-white/10 bg-zinc-950 text-zinc-600",
                )}
              >
                {isDone ? (
                  <Check className="size-3.5" />
                ) : isActive ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <CircleDashed className="size-3.5" />
                )}
              </span>
              <div className="pt-0.5">
                <p className={cn("text-sm font-medium", isActive || isDone ? "text-white" : "text-zinc-600")}>
                  {stage.name}
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-600">
                  {stage.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {AI_WORKFLOW.map((stage, index) => (
        <li
          key={stage.id}
          className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-lime-300/20 hover:bg-lime-300/[0.025]"
        >
          <div className="mb-8 flex items-center justify-between">
            <span className="font-mono text-[10px] text-zinc-600">
              0{index + 1}
            </span>
            <span className="size-1.5 rounded-full bg-zinc-700 transition group-hover:bg-lime-300" />
          </div>
          <p className="text-sm font-medium text-zinc-200">{stage.name}</p>
          <p className="mt-2 text-xs leading-5 text-zinc-600">
            {stage.description}
          </p>
        </li>
      ))}
    </ol>
  );
}
