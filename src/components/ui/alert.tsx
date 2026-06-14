import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  danger: { cls: "border-danger-line bg-danger-surface text-danger-ink", Icon: AlertCircle },
  warning: { cls: "border-warning-line bg-warning-surface text-warning-ink", Icon: AlertTriangle },
  success: { cls: "border-success-line bg-success-surface text-success-ink", Icon: CheckCircle2 },
  info: { cls: "border-info-line bg-info-surface text-info-ink", Icon: Info },
} as const;

/**
 * Inline status message (validation errors, save results, warnings).
 * Token-backed → readable in light & dark; includes an icon so the meaning
 * is never conveyed by color alone. role="alert" announces it to screen readers.
 */
export function Alert({
  tone = "info",
  children,
  className,
  icon = true,
}: {
  tone?: keyof typeof tones;
  children: React.ReactNode;
  className?: string;
  icon?: boolean;
}) {
  const { cls, Icon } = tones[tone];
  return (
    <div role="alert" className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-sm", cls, className)}>
      {icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
