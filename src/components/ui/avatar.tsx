import { cn, initials } from "@/lib/utils";

export function Avatar({
  firstName,
  lastName,
  size = "md",
  className,
}: {
  firstName: string;
  lastName: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  } as const;

  const seed = (firstName + lastName).toLowerCase();
  const hue = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-full font-bold text-white shadow-md ring-1 ring-white/10",
        sizes[size],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 70% 35%), hsl(${(hue + 40) % 360} 70% 25%))`,
      }}
      aria-hidden
    >
      {initials(firstName, lastName)}
    </div>
  );
}
