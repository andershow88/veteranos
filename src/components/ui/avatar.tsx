import { cn, initials } from "@/lib/utils";

export function Avatar({
  firstName,
  lastName,
  size = "md",
  className,
  src,
}: {
  firstName: string;
  lastName?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** Optional image URL or data URL. Falls back to a colored initials avatar. */
  src?: string | null;
}) {
  const safeLast = lastName ?? "";
  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  } as const;

  if (src) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-full ring-1 ring-white/10 shadow-md bg-surface-2",
          sizes[size],
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${firstName}${safeLast ? ` ${safeLast}` : ""}`}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>
    );
  }

  const seed = (firstName + safeLast).toLowerCase();
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
      {initials(firstName, safeLast)}
    </div>
  );
}
