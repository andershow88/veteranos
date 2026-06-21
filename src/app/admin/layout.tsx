import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Users, CalendarDays, LayoutDashboard, ShieldCheck, Link as LinkIcon, SlidersHorizontal } from "lucide-react";
import { AdminNavItem } from "@/components/admin/admin-nav-item";

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
          <h1 className="font-display text-4xl tracking-wide">Management</h1>
        </div>
      </div>

      <nav className="mb-8 flex flex-wrap gap-2">
        <AdminNavItem href="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</AdminNavItem>
        <AdminNavItem href="/admin/players" icon={<Users className="h-4 w-4" />}>Players</AdminNavItem>
        <AdminNavItem href="/admin/skills" icon={<SlidersHorizontal className="h-4 w-4" />}>Skills</AdminNavItem>
        <AdminNavItem href="/admin/matches" icon={<CalendarDays className="h-4 w-4" />}>Matches</AdminNavItem>
        <AdminNavItem href="/admin/invites" icon={<LinkIcon className="h-4 w-4" />}>Invites</AdminNavItem>
      </nav>

      <div>{children}</div>
    </div>
  );
}
