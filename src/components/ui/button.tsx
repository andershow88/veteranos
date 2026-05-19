import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-linear-to-br from-pitch-500 to-pitch-700 text-white shadow-[0_4px_20px_-4px_rgba(59,130,246,0.5)] hover:shadow-[0_6px_30px_-4px_rgba(59,130,246,0.7)] hover:from-pitch-400 hover:to-pitch-600 dark:from-pitch-400 dark:to-pitch-600 dark:text-white dark:hover:from-pitch-300 dark:hover:to-pitch-500",
        secondary:
          "bg-surface-2 text-foreground border-2 border-border-strong hover:bg-surface hover:border-pitch-500",
        ghost:
          "text-foreground/90 hover:text-foreground hover:bg-surface-2 border border-transparent hover:border-border",
        danger:
          "bg-linear-to-br from-red-600 to-red-800 text-white shadow-[0_4px_20px_-4px_rgba(239,68,68,0.4)] hover:from-red-500 hover:to-red-700",
        outline:
          "border-2 border-border-strong bg-transparent text-foreground hover:bg-surface-2 hover:border-pitch-500",
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
