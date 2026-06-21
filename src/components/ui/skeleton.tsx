import { cn } from "@/lib/utils";

/** Placeholder block shown while content loads. Pulse is auto-disabled under
 * prefers-reduced-motion by the global media query. */
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-surface-2", className)} style={style} />;
}
