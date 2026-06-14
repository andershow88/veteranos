"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, User, BookOpen, ShieldCheck } from "lucide-react";

type Item = { href: string; label: string; Icon: typeof CalendarDays; match: (p: string) => boolean };

const BASE_ITEMS: Item[] = [
  { href: "/", label: "Matches", Icon: CalendarDays, match: (p) => p === "/" || p.startsWith("/matches") },
  { href: "/profile", label: "Profile", Icon: User, match: (p) => p.startsWith("/profile") },
  { href: "/handout", label: "Guide", Icon: BookOpen, match: (p) => p.startsWith("/handout") },
];
const ADMIN_ITEM: Item = { href: "/admin", label: "Admin", Icon: ShieldCheck, match: (p) => p.startsWith("/admin") };

/**
 * Mobile bottom navigation (PWA-friendly): large touch targets, safe-area
 * aware, active-page marking. Admin entry only for admins. Hidden on md+.
 */
export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...BASE_ITEMS, ADMIN_ITEM] : BASE_ITEMS;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-bg/90 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition " +
                  (active ? "text-pitch-300" : "text-foreground/60 hover:text-foreground")
                }
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
