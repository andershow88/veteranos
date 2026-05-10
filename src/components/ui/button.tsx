import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-linear-to-br from-pitch-400 to-pitch-600 text-[#06140c] shadow-[0_8px_30px_-8px_rgba(16,185,129,0.6)] hover:shadow-[0_8px_40px_-6px_rgba(16,185,129,0.85)] hover:from-pitch-300 hover:to-pitch-500",
        secondary:
          "bg-surface-2 text-foreground border border-border-strong hover:bg-surface hover:border-pitch-500",
        ghost:
          "text-foreground/80 hover:text-foreground hover:bg-surface-2",
        danger:
          "bg-linear-to-br from-red-500 to-red-700 text-white hover:from-red-400 hover:to-red-600",
        outline:
          "border border-border-strong bg-transparent text-foreground hover:bg-surface-2",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
