import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays, Plus, ListChecks, Lock } from "lucide-react";
import { formatMatchDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [playerCount, subscriberCount, waitlistCount, upcomingMatches, lastMatch] = await Promise.all([
    db.player.count({ where: { active: true } }),
    db.player.count({ where: { active: true, kind: "SUBSCRIBER" } }),
    db.player.count({ where: { active: true, kind: "WAITLIST" } }),
    db.match.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 5,
      include: { _count: { select: { signups: true } } },
    }),
    db.match.findFirst({
      where: { date: { lt: new Date() } },
      orderBy: { date: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat title="Spieler" value={playerCount} subtitle={`${subscriberCount} Abo · ${waitlistCount} Warteliste`} />
        <Stat title="Anstehende Termine" value={upcomingMatches.length} />
        <Stat title="Letzter Termin" value={lastMatch ? formatMatchDate(lastMatch.date) : "—"} small />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-pitch-300" />
              <h2 className="font-display text-2xl tracking-wide">Termine</h2>
            </div>
            <Link href="/admin/matches/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> Neuer Termin
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="space-y-2">
            {upcomingMatches.length === 0 ? (
              <p className="text-sm text-muted">Keine anstehenden Termine.</p>
            ) : (
              upcomingMatches.map((m) => (
                <Link
                  key={m.id}
                  href={`/admin/matches/${m.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-surface px-3 py-2 hover:border-pitch-500 transition"
                >
                  <div>
                    <div className="text-sm font-medium">{formatMatchDate(m.date)}</div>
                    <div className="text-xs text-muted">{m.location ?? "Ort offen"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.locked && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-300">
                        <Lock className="h-3 w-3" /> gesperrt
                      </span>
                    )}
                    <span className="number-pill text-xs text-pitch-300">{m._count.signups} Einträge</span>
                  </div>
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-pitch-300" />
              <h2 className="font-display text-2xl tracking-wide">Spieler</h2>
            </div>
            <Link href="/admin/players/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> Neuer Spieler
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-muted">
              {playerCount} aktive Spieler insgesamt. {subscriberCount} feste Abo-Plätze, {waitlistCount} auf der Warteliste.
            </p>
            <Link href="/admin/players">
              <Button variant="secondary" size="sm">
                <ListChecks className="h-4 w-4" /> Alle Spieler verwalten
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  subtitle,
  small,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border-strong/60 bg-surface/50 p-5">
      <div className="text-xs font-bold uppercase tracking-[0.25em] text-pitch-300">{title}</div>
      <div className={`mt-1 font-display ${small ? "text-xl" : "text-4xl"} tracking-wide text-foreground`}>
        {value}
      </div>
      {subtitle && <div className="mt-1 text-xs text-muted">{subtitle}</div>}
    </div>
  );
}
