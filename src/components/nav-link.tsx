"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/matches");
  return pathname === href || pathname.startsWith(href + "/");
}

/** Desktop header link with active-page marking (usePathname). */
export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        "rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap " +
        (active
          ? "bg-surface-2 text-foreground"
          : "text-foreground/70 hover:bg-surface-2/70 hover:text-foreground")
      }
    >
      {children}
    </Link>
  );
}
