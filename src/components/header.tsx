import Link from "next/link";
import { logoutAction } from "@/server/auth-actions";
import { Button } from "./ui/button";
import { Trophy, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { AdminDetailsToggle } from "./match/admin-details-toggle";

type Props = {
  user: { email: string; role: "ADMIN" | "PLAYER"; playerName: string | null } | null;
};

export function Header({ user }: Props) {
  return (
    <header
      className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-md bg-bg/70"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group min-w-0">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-pitch-400 to-pitch-700 shadow-[0_8px_30px_-8px_rgba(20,184,166,0.6)] group-hover:scale-105 transition-transform">
            <Trophy className="h-5 w-5 text-[#0a1414]" strokeWidth={2.5} />
          </span>
          <div className="leading-tight min-w-0">
            <div className="font-display text-xl sm:text-2xl tracking-[0.18em] text-pitch-100 truncate">
              VETERANOS
            </div>
            <div className="hidden sm:block text-[10px] uppercase tracking-[0.25em] text-subtle -mt-0.5">
              Match Organizer
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink href="/">Matches</NavLink>
          {user && <NavLink href="/profile">Profile</NavLink>}
          <NavLink href="/handout">Handout</NavLink>
          {user?.role === "ADMIN" && <NavLink href="/admin">Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {user?.role === "ADMIN" && <AdminDetailsToggle />}
          <ThemeToggle />
          {user ? (
            <>
              <div className="hidden lg:flex items-center gap-2 rounded-full border border-border/60 bg-surface px-3 py-1.5 max-w-56">
                {user.role === "ADMIN" ? (
                  <ShieldCheck className="h-4 w-4 text-pitch-300 shrink-0" />
                ) : (
                  <UserIcon className="h-4 w-4 text-pitch-300 shrink-0" />
                )}
                <span className="text-xs text-foreground/80 truncate">
                  {user.playerName ?? user.email}
                </span>
              </div>
              <form action={logoutAction}>
                <Button variant="ghost" size="icon" title="Logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">Login</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav row. Scrolls horizontally if needed instead of wrapping. */}
      <nav className="md:hidden flex items-center gap-1 px-3 pb-2 pt-1 border-t border-border/40 overflow-x-auto scrollbar-thin">
        <NavLink href="/">Matches</NavLink>
        {user && <NavLink href="/profile">Profile</NavLink>}
        <NavLink href="/handout">Handout</NavLink>
        {user?.role === "ADMIN" && <NavLink href="/admin">Admin</NavLink>}
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-surface-2 transition whitespace-nowrap"
    >
      {children}
    </Link>
  );
}
