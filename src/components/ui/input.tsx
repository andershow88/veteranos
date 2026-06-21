import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm",
        "placeholder:text-subtle text-foreground",
        "focus:border-pitch-500 focus:outline-none focus:ring-2 focus:ring-pitch-500/60",
        "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm min-h-20",
        "placeholder:text-subtle text-foreground",
        "focus:border-pitch-500 focus:outline-none focus:ring-2 focus:ring-pitch-500/60",
        "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn("text-xs font-semibold uppercase tracking-wider text-muted", className)}
    {...props}
  />
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground",
        "focus:border-pitch-500 focus:outline-none focus:ring-2 focus:ring-pitch-500/60 transition-colors",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
