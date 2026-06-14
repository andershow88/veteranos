import { cn } from "@/lib/utils";

// Token-backed tones — readable (WCAG AA) and theme-aware in light & dark
// via the semantic --color-*-surface/-line/-ink tokens in globals.css.
const tones = {
  default: "bg-neutral-surface text-neutral-ink border-neutral-line",
  success: "bg-success-surface text-success-ink border-success-line",
  danger: "bg-danger-surface text-danger-ink border-danger-line",
  warn: "bg-warning-surface text-warning-ink border-warning-line",
  info: "bg-info-surface text-info-ink border-info-line",
  outline: "bg-transparent text-foreground border-border-strong",
} as const;

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
