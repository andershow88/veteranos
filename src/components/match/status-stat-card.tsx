import { cn } from "@/lib/utils";

export type StatTone = "success" | "warning" | "info" | "neutral" | "danger";

// Calm styling: neutral surface + a thin tinted border; the semantic colour
// only carries the icon and the number. Readable in light & dark.
const tones: Record<StatTone, { fg: string; border: string }> = {
  success: { fg: "text-success-ink", border: "border-success-line" },
  warning: { fg: "text-warning-ink", border: "border-warning-line" },
  info: { fg: "text-info-ink", border: "border-info-line" },
  neutral: { fg: "text-neutral-ink", border: "border-neutral-line" },
  danger: { fg: "text-danger-ink", border: "border-danger-line" },
};

/**
 * Compact, uniform status tile — identical height, padding, radius and
 * typography across all tiles. Structure: icon + value in one row, label below.
 */
export function StatusStatCard({
  icon,
  value,
  label,
  tone,
  className,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: StatTone;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <div
      className={cn(
        "flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border bg-surface/50 px-3 py-3 text-center",
        t.border,
        className,
      )}
    >
      <span className="flex items-center gap-1.5">
        <span className={cn("shrink-0", t.fg)} aria-hidden>
          {icon}
        </span>
        <span className={cn("text-2xl font-bold leading-none tabular-nums", t.fg)}>{value}</span>
      </span>
      <span className="text-xs font-semibold uppercase leading-tight tracking-wide text-muted">
        {label}
      </span>
    </div>
  );
}
