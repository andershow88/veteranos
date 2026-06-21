"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Admin sub-nav item with current-page highlighting (mirrors NavLink). */
export function AdminNavItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Exact match for the dashboard root, prefix match for the sections.
  const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition " +
        (active
          ? "border-pitch-500 bg-surface-2 text-foreground"
          : "border-border-strong bg-surface text-foreground/85 hover:border-pitch-500 hover:bg-surface-2")
      }
    >
      {icon}
      {children}
    </Link>
  );
}
