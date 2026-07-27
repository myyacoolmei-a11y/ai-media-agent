import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300/70 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-lime-300 text-black shadow-[0_0_30px_rgba(190,242,100,0.15)] hover:bg-lime-200",
        secondary:
          "border border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]",
        ghost: "text-zinc-400 hover:bg-white/[0.05] hover:text-white",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-7 text-base",
        icon: "size-10 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
