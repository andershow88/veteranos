import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Users, CalendarDays, LayoutDashboard, ShieldCheck } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-pitch-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin
          </div>
          <h1 className="font-display text-4xl tracking-wide">Verwaltung</h1>
        </div>
      </div>

      <nav className="mb-8 flex flex-wrap gap-2">
        <NavItem href="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</NavItem>
        <NavItem href="/admin/players" icon={<Users className="h-4 w-4" />}>Spieler</NavItem>
        <NavItem href="/admin/matches" icon={<CalendarDays className="h-4 w-4" />}>Termine</NavItem>
      </nav>

      <div>{children}</div>
    </div>
  );
}

function NavItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-surface px-3.5 py-2 text-sm font-semibold text-foreground/85 hover:border-pitch-500 hover:bg-surface-2 transition"
    >
      {icon}
      {children}
    </Link>
  );
}
