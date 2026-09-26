import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500",
  {
    variants: {
      variant: {
        default:
          "border-emerald-500/50 bg-emerald-500/20 text-emerald-400",
        secondary:
          "border-slate-700 bg-slate-800 text-slate-300",
        low:
          "border-blue-500/50 bg-blue-500/20 text-blue-400",
        medium:
          "border-yellow-500/50 bg-yellow-500/20 text-yellow-400",
        high:
          "border-orange-500/50 bg-orange-500/20 text-orange-400",
        critical:
          "border-red-500/50 bg-red-500/20 text-red-400 animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
