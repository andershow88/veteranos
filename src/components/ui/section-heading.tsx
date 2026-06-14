import { cn } from "@/lib/utils";

/** Small uppercase section label for grouping content consistently. */
export function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-xs font-bold uppercase tracking-[0.2em] text-pitch-300", className)}>
      {children}
    </h2>
  );
}
