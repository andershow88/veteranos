import { cn } from "@/lib/utils";

const tones = {
  default: "bg-surface-2 text-pitch-100 border-border-strong",
  success: "bg-pitch-700/30 text-pitch-200 border-pitch-600/60",
  danger: "bg-red-900/40 text-red-200 border-red-700/60",
  warn: "bg-amber-900/30 text-amber-200 border-amber-700/60",
  info: "bg-sky-900/30 text-sky-200 border-sky-700/60",
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
